# shadcn/ui Migration Summary

## Overview
This document summarizes the migration of the Next.js installer program to use shadcn/ui components throughout the application.

## Completed Migrations

### ✅ Pages Successfully Migrated
1. **app/dashboard/page.tsx**
   - Migrated to Card, Button, Skeleton, Progress components
   - Uses proper theming with background, foreground, muted-foreground
   - Dark mode compatible

2. **app/team/page.tsx**
   - Migrated to Table, Badge, Alert, Button, Card components
   - Proper table structure with TableHeader, TableBody, TableRow, TableCell
   - Badge variants for role indication

3. **app/auth/signin/page.tsx** (Previously migrated)
   - Uses Card, Button, Input, Label, Alert components

### ✅ Components Successfully Migrated
1. **components/Modal.tsx**
   - Converted from Radix Dialog to shadcn Dialog
   - Uses DialogContent, DialogHeader, DialogTitle, DialogDescription
   - Maintains size customization and external link functionality

2. **components/Navbar.tsx** (Previously migrated)
   - Uses Button, DropdownMenu components

3. **components/FormError.tsx** (Previously created)
   - Uses Alert component

4. **components/ErrorAlert.tsx** (Previously created)
   - Uses Alert component

### ✅ UI Components Available
All shadcn/ui components are installed in `components/ui/`:
- alert.tsx, alert-dialog.tsx, avatar.tsx, badge.tsx
- button.tsx, card.tsx, checkbox.tsx, dialog.tsx
- dropdown-menu.tsx, form.tsx, input.tsx, label.tsx
- popover.tsx, progress.tsx, scroll-area.tsx, select.tsx
- separator.tsx, sheet.tsx, skeleton.tsx, switch.tsx
- table.tsx, tabs.tsx, tooltip.tsx

## Remaining Migrations Needed

### 📋 Pages to Migrate

#### High Priority
1. **app/installers/page.tsx**
   - Replace `<table>` → `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`
   - Replace buttons → `<Button>` with variants
   - Replace input → `<Input>`
   - Replace badges/spans → `<Badge>`
   - Replace column menu div → `<Popover>` or `<DropdownMenu>`

2. **app/rewards/page.tsx**
   - Similar table migration as installers
   - Filter section can use `<Card>` wrapper
   - Copy buttons can use `<Button variant="ghost" size="icon">`
   - Status badges → `<Badge variant="...">`

3. **app/reports/page.tsx**
   - Card grid already good, just need `<Card>`, `<CardHeader>`, `<CardContent>`
   - Replace buttons → `<Button>`
   - Filter inputs → `<Input>` and `<Select>`

#### Medium Priority
4. **app/installers/new/page.tsx**
   - Multi-step form with `<Card>` containers
   - Replace all inputs → `<Input>`
   - Replace selects → `<Select>`
   - Replace checkboxes → `<Checkbox>`
   - Replace textareas → `<Textarea>` (may need to add this component)
   - Step indicators can stay custom or use `<Tabs>`

5. **app/installers/[id]/page.tsx**
   - Details view with `<Card>` sections
   - Info display with `<Table>` for structured data
   - Action buttons → `<Button>` variants

6. **app/rewards/new/page.tsx**
   - Form inputs → `<Input>`, `<Select>`, `<Checkbox>`
   - Card wrapper → `<Card>`

7. **app/rewards/[id]/page.tsx**
   - Details display with `<Card>` and `<Table>`
   - Status badge → `<Badge>`

8. **app/rewards/[id]/edit/page.tsx**
   - Form migration similar to new page

9. **app/rewards/bulk-upload/page.tsx**
   - File upload interface
   - Results table → `<Table>` components

#### Lower Priority
10. **app/settings/page.tsx**
    - Settings form with `<Card>` sections
    - Toggles → `<Switch>`
    - Inputs → `<Input>`

11. **app/activity/page.tsx**
    - Activity log with `<Card>` or `<Table>`
    - Timestamp badges → `<Badge>`

### 📋 Modal Components to Migrate

All modal components already use the migrated Modal.tsx component, but their internal forms need migration:

1. **components/InstallerEditModal.tsx**
   - Form inputs → `<Input>`, `<Select>`, `<Checkbox>`
   - Submit/Cancel buttons → `<Button>` variants
   - Replace grid div → maintain but use proper spacing

2. **components/TeamRegisterModal.tsx**
   - Similar input migration
   - Password match indicator can use custom or `<Alert>`

3. **components/TeamEditModal.tsx**
   - Similar to TeamRegisterModal

4. **components/RewardEditModal.tsx** (if exists)
   - Form migration similar to other modals

## Migration Pattern Guide

### Converting Tables
```tsx
// OLD
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3...">Header</th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    <tr>
      <td className="px-6 py-4...">Cell</td>
    </tr>
  </tbody>
</table>

// NEW
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Header</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Cell</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Converting Buttons
```tsx
// OLD
<button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
  Click Me
</button>

// NEW
<Button>Click Me</Button>

// Variants:
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="secondary">Secondary</Button>

// Sizes:
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Converting Cards
```tsx
// OLD
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-semibold mb-4">Title</h2>
  <p>Content</p>
</div>

// NEW
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content</p>
  </CardContent>
</Card>
```

### Converting Inputs
```tsx
// OLD
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// NEW
<Input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Converting Selects
```tsx
// OLD
<select className="w-full px-3 py-2 border...">
  <option value="">Select</option>
  <option value="1">Option 1</option>
</select>

// NEW
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Converting Badges/Pills
```tsx
// OLD
<span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
  Active
</span>

// NEW
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Pending</Badge>
```

### Converting Alerts
```tsx
// OLD
<div className="p-4 bg-red-50 border border-red-200 rounded-md">
  <p className="text-red-800">Error message</p>
</div>

// NEW
<Alert variant="destructive">
  <AlertDescription>Error message</AlertDescription>
</Alert>

// Variants: default, destructive
```

## Color Theme Usage

Always use semantic color tokens:
- `bg-background` instead of `bg-gray-50`
- `text-foreground` instead of `text-gray-900`
- `text-muted-foreground` instead of `text-gray-600`
- `border` instead of `border-gray-200`

## Dark Mode Support

All shadcn components support dark mode automatically when using:
- Semantic tokens (background, foreground, etc.)
- ThemeProvider wrapper (already configured)
- dark: prefix for dark-specific styles when needed

## Testing Checklist

After migration, test:
- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Form validations
- [ ] Button states (hover, active, disabled)
- [ ] Modal interactions
- [ ] Table sorting and filtering
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Additional Components Needed

If you encounter missing components during migration:

1. **Textarea** - May need to add:
```bash
npx shadcn@latest add textarea --legacy-peer-deps
```

2. **Combobox** - For searchable selects:
```bash
npx shadcn@latest add combobox --legacy-peer-deps
```

3. **Date Picker** - For date inputs:
```bash
npx shadcn@latest add calendar --legacy-peer-deps
```

## Next Steps

1. Continue migrating remaining pages in priority order
2. Update modal component internals
3. Add any missing UI components as needed
4. Test all functionality
5. Perform accessibility audit
6. Update documentation

## Notes

- The Modal.tsx component is now fully migrated and all modals using it will benefit
- Progress component was custom-created and installed successfully
- All installations use `--legacy-peer-deps` due to React 19 compatibility
