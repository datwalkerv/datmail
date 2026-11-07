<div align="center">

<img src="./public/icon.svg" width="10%" alt="datmail" style="border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);" />

# datmail

**Gmail, without the noise.**

A Chrome extension that redesigns Gmail in place: calmer, darker, faster to read. It keeps every email on your machine.

</div>

## ✨ Key Features

- **🌑 A Real Dark Mode**: Layered warm neutrals instead of Gmail's mismatched greys. The sidebar, inbox, reading pane, compose window, menus and tooltips all share one palette. Light and system modes too.
- **📨 Dark Emails**: Messages designed for white backgrounds are shown dark, while photos and logos keep their original colors. One toggle turns it off.
- **🧹 Quieter Rows**: No checkboxes, no Archive or Snooze clutter, and the star only appears when you hover it. Unread mail gets a brighter sender, not a wall of bold.
- **🔑 Verification Codes**: One-time codes from the last 24 hours appear above the inbox as cards. One click copies the code, the app name opens the email. Fresh codes are highlighted; old ones fade and then disappear.
- **🛡️ Conservative Filtering**: Loud marketing is moved out of the inbox view into a **Filtered** list you can review. Invoices, receipts, security alerts, account emails and anything with a code are never touched. **Restore** brings a sender back for good.
- **🏷️ Categories**: Group mail by sender or keyword (Clients, Personal, and a built-in **Money** for invoices, receipts and payments) with a color and an optional emoji. Their emails get a subtle accent, and a chip above the inbox lists every one of them across your mailbox.
- **🪟 More Room**: The right-hand side panel (Calendar, Keep, Tasks, Contacts) is hidden by default, and the inbox stretches into the space.
- **⚙️ Live Settings**: Every change in the settings page applies to open Gmail tabs instantly, no reload.
- **🇭🇺 Language-Proof**: Nothing depends on Gmail's interface language, so it works the same in Hungarian, English or anything else.

## 🛠️ Technology Stack

- **Extension Framework**: [WXT](https://wxt.dev/) (Manifest V3)
- **View Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) for settings, plain CSS custom properties for Gmail
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)

Keep Gmail's own theme on **Default**; datmail draws dark mode itself. Row density follows Gmail's own setting.

## ⚖️ Privacy & Security

- datmail has **no servers, no accounts, and makes no network requests**. Your mail never leaves your browser.

### Permissions

- **`storage`**: saves your settings, categories and allow/block lists on this device.
- **`mail.google.com`**: lets datmail restyle Gmail and read the inbox rows it already shows you.
- Nothing else.

### Privacy Policy

- datmail collects **absolutely nothing** about you. No analytics, no telemetry, no tracking of any kind.
- Codes and filtering only look at the sender, subject and preview line Gmail already displays. Email bodies are never read, and everything is processed in memory and never stored.
- Nothing is deleted or moved in your mailbox; filtering only changes what this browser shows.
- The only data stored is what you set yourself, in `chrome.storage.local`:
  - Theme and inbox preferences
  - Your categories and their senders
  - Your "never filter" and "always filter" lists

<br>

**Made with love for love. 🤍**  
*Gmail, without the noise.*
