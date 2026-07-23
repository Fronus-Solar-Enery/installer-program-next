import { FilterQuery } from "mongoose";
import { IInstallerReward } from "@/models/InstallerReward";
import { QueryBuilder, escapeRegex } from "@/lib/queryBuilder";
import Installer from "@/models/Installer";

/**
 * The one place reward list filters are turned into a Mongo query.
 *
 * The rewards list and the rewards export both call this, so a download always
 * matches what is on screen. They previously built their own queries and had
 * drifted: the export silently ignored payment method, team member, sending
 * date and installation date.
 */
export async function buildRewardsQuery(
  params: URLSearchParams
): Promise<FilterQuery<IInstallerReward>> {
  const get = (key: string) => {
    const value = params.get(key)?.trim();
    // "all"/"ALL" are the list page's "no filter" sentinels, not real values.
    if (!value || value === "all" || value === "ALL") return undefined;
    return value;
  };

  const searchValue = get("search");
  const builder = new QueryBuilder<IInstallerReward>()
    .enumFilter("rewardStatus", get("rewardStatus"))
    .filter("productModel", get("productModel"), { regex: true })
    .filter("cityOfInstallation", get("city"), { regex: true })
    .filter("paymentMethod", get("paymentMethod"))
    .filter("installerCode", get("installerCode")?.toUpperCase())
    .ref("installer", get("installer"))
    .ref("registeredBy", get("registeredBy") ?? get("teamMember"))
    .dateRange("createdAt", get("startDate"), get("endDate"))
    .dateRange("sendingDate", get("sendingStart"), get("sendingEnd"))
    .dateRange(
      "installationDate",
      get("installationStart"),
      get("installationEnd")
    );

  if (searchValue) {
    const pattern = escapeRegex(searchValue);
    const $or: FilterQuery<IInstallerReward>["$or"] = [
      { serialNumber: { $regex: pattern, $options: "i" } },
      { transactionId: { $regex: pattern, $options: "i" } },
      { referrerTransactionId: { $regex: pattern, $options: "i" } },
      { installerCode: { $regex: pattern, $options: "i" } },
    ];

    const matchingInstallers = await Installer.find(
      { fullName: { $regex: pattern, $options: "i" } },
      { _id: 1 }
    ).lean();

    if (matchingInstallers.length > 0) {
      $or.push({
        installer: { $in: matchingInstallers.map((i) => i._id) },
      });
    }

    builder.raw({ $or });
  }

  return builder.build();
}
