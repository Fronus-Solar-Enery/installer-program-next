# WhatsApp Integration Setup Guide

This application supports WhatsApp notifications for installers when:
1. A new installer is registered
2. A reward payment is marked as PAID

## Free Option: CallMeBot API

CallMeBot provides a FREE WhatsApp API service that works well for small to medium scale usage.

### Setup Steps:

#### 1. Add CallMeBot to WhatsApp
- Save this number in your phone contacts: **+34 644 31 95 72**
- Name it: **CallMeBot**

#### 2. Activate Your API Key
1. Open WhatsApp and send this exact message to the CallMeBot number:
   ```
   I allow callmebot to send me messages
   ```

2. You will receive a response with your API key. It looks like:
   ```
   Your API key is: 123456
   ```

3. Save this API key - you'll need it!

#### 3. Configure Environment Variables
Add the following to your `.env.local` file:

```env
# WhatsApp Configuration (CallMeBot)
CALLMEBOT_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with the API key you received.

#### 4. Test the Integration
1. Register a test installer with a valid WhatsApp number
2. The installer will receive a welcome message
3. Mark a reward as PAID - the installer will receive a payment confirmation

### Important Notes:
- CallMeBot is FREE but has rate limits
- Recipients must have CallMeBot activated on their WhatsApp
- Messages are sent to the WhatsApp number registered in the installer's profile
- Failed messages are logged in the Activity section

---

## Paid Alternative: Twilio WhatsApp API

For production use with higher reliability, consider Twilio WhatsApp API.

### Setup Steps:

#### 1. Create a Twilio Account
1. Go to https://www.twilio.com/console
2. Sign up for a new account
3. Verify your email and phone number

#### 2. Enable WhatsApp Sandbox (for testing)
1. Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
2. Follow instructions to join your sandbox
3. Send the code they provide to their WhatsApp number

#### 3. Get Production Access (for live use)
1. Apply for WhatsApp Business API access
2. Get your WhatsApp sender approved
3. This may take a few days

#### 4. Get Your Credentials
From your Twilio Console:
- Account SID
- Auth Token
- WhatsApp Phone Number (e.g., `whatsapp:+14155238886`)

#### 5. Install Twilio Package
```bash
npm install twilio
```

#### 6. Configure Environment Variables
Add to `.env.local`:

```env
# WhatsApp Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

#### 7. Update the Code
In `lib/whatsappService.ts`, uncomment the Twilio implementation section and update the main `sendWhatsAppMessage` function to use `sendWhatsAppViaTwilio`.

### Pricing:
- WhatsApp messages: ~$0.005 per message
- Free trial credits available
- Pay-as-you-go pricing

---

## Other Alternatives

### 1. **Waboxapp** (Free tier available)
- Website: https://www.waboxapp.com/
- Free: 1000 messages/month
- Setup: Register → Get API token → Use their API

### 2. **WATI** (Paid, popular in Pakistan)
- Website: https://www.wati.io/
- Specifically designed for WhatsApp Business
- Good support, reliable delivery
- Pricing starts at $49/month

### 3. **MessageBird**
- Website: https://www.messagebird.com/
- WhatsApp Business API
- Pay-as-you-go pricing
- Good developer experience

### 4. **Meta WhatsApp Business Platform** (Official)
- Most reliable but complex setup
- Requires business verification
- Free tier available
- Best for large scale operations

---

## Testing WhatsApp Integration

### 1. Check Configuration
```bash
# Make sure CALLMEBOT_API_KEY is set
echo $CALLMEBOT_API_KEY
```

### 2. Test Message Format
The application sends properly formatted WhatsApp messages with:
- Emojis for better UX
- Bold text using *asterisks*
- Line breaks for readability

Example message:
```
🎉 *Welcome to Installer Program!*

Dear John Doe,

Your installer account has been successfully registered.

*Installer Code:* INS001

You can now start installing products and earning rewards.

For any queries, please contact our support team.

Best regards,
Installer Program Team
```

### 3. Monitor Activity Log
- Go to Activity page in the app
- Filter by "WHATSAPP"
- Check for WHATSAPP_SENT (success) or WHATSAPP_FAILED (errors)
- View error messages for failed attempts

### 4. Common Issues

**Issue: "WhatsApp service not configured"**
- Solution: Add CALLMEBOT_API_KEY to .env.local

**Issue: Messages not received**
- Check if recipient has CallMeBot activated
- Verify phone number format: +92XXXXXXXXXX
- Check rate limits

**Issue: "Invalid phone number"**
- Ensure number starts with +92
- Remove any spaces or special characters
- Example: +923001234567

---

## Best Practices

1. **Always log WhatsApp attempts** - Already implemented in the activity logger
2. **Don't block the main request** - Messages are sent asynchronously
3. **Handle failures gracefully** - App continues to work even if WhatsApp fails
4. **Respect rate limits** - Don't spam messages
5. **Test with your own number first**
6. **Monitor delivery rates** - Check activity logs regularly

---

## Disabling WhatsApp (if needed)

If you want to temporarily disable WhatsApp notifications:

1. Simply remove or comment out `CALLMEBOT_API_KEY` from `.env.local`
2. The app will continue to work, but won't send WhatsApp messages
3. Activity log will show "WhatsApp service not configured"

---

## Support

For issues with:
- **CallMeBot**: Visit https://www.callmebot.com/
- **Twilio**: https://support.twilio.com/
- **App Integration**: Check the Activity logs or console errors
