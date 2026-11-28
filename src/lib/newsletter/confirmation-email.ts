import { escapeXml } from '../seo/sitemap';

// Email clients need inline values for the START Berlin website palette.
const navy = '#00002c';
const cyan = '#02c3de';
const font = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const subject = 'Confirm your START Berlin newsletter sign-up';
const purpose = 'Open the confirmation page to finish signing up for the START Berlin newsletter and get updates on when applications open.';
const expiry = 'This link is valid for 24 hours.';
const ignore = 'If you did not request this email, you can ignore it.';
const action = 'Confirm my sign-up';

export function confirmationEmailMessage(link: URL) {
  const href = escapeXml(link.href);
  const logo = escapeXml(new URL('/social/start-berlin-logo.png', link).href);
  const text = [purpose, `${action}:\n${link.href}`, `${expiry} ${ignore}`, 'START Berlin e.V.'].join('\n\n');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-gutter { padding-left: 24px !important; padding-right: 24px !important; }
      .email-title { font-size: 30px !important; line-height: 33px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef1f5;font-family:${font};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f5">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;">
          <tr>
            <td class="email-gutter" bgcolor="${navy}" style="padding:28px 40px 30px;border-bottom:4px solid ${cyan};color:#ffffff;">
              <img src="${logo}" alt="START Berlin" width="108" height="49" style="display:block;border:0;color:#ffffff;font-size:15px;">
              <h1 class="email-title" style="margin:22px 0 0;font-family:${font};font-size:38px;line-height:40px;font-weight:800;letter-spacing:-0.8px;text-transform:uppercase;color:#ffffff;">
                Confirm your<br><span style="color:${cyan};">newsletter sign-up</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td class="email-gutter" style="padding:30px 40px 28px;color:${navy};">
              <p style="margin:0 0 22px;font-size:16px;line-height:25px;">${purpose}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${cyan}" style="mso-padding-alt:13px 22px;">
                    <a href="${href}" style="display:inline-block;padding:13px 22px;mso-padding-alt:0;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;color:${navy};">${action}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:22px 0 0;font-size:13px;line-height:21px;color:#4e546a;">${expiry} ${ignore}</p>
            </td>
          </tr>
          <tr>
            <td class="email-gutter" bgcolor="#f6f8fa" style="padding:16px 40px;border-top:1px solid #e3e7ed;color:#4e546a;font-size:13px;line-height:20px;">
              START Berlin e.V.
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
