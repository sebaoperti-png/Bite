"""Builds the Supabase auth email templates (EN + DE in one file, chosen by the user's `lang` metadata).
Run: python3 build.py  -> confirm.html, recovery.html. Paste them in Supabase -> Authentication -> Emails -> Templates."""
T = {
 "confirm": dict(
   kicker=("Table for one · new guest", "Tisch für eine Person · neuer Gast"),
   title=("your seat is almost ready.", "dein Platz ist fast bereit."),
   body=("Tap the button to confirm your email. Then you can book home-cooked meals from your neighbours, or host a table of your own.",
         "Tippe auf den Button, um deine E-Mail zu bestätigen. Danach kannst du hausgemachte Gerichte aus deiner Nachbarschaft buchen oder selbst einen Tisch decken."),
   button=("Confirm my email", "E-Mail bestätigen"),
   note=("The link works for one hour. If you didn't create a Bite account, just ignore this email.",
         "Der Link ist eine Stunde gültig. Wenn du kein Bite-Konto erstellt hast, ignoriere diese E-Mail einfach."),
   subject=("Confirm your seat at Bite", "Bestätige deinen Platz bei Bite")),
 "recovery": dict(
   kicker=("Lost the key to the dining room?", "Schlüssel zum Esszimmer verloren?"),
   title=("let's choose a new password.", "lass uns ein neues Passwort wählen."),
   body=("Tap the button to choose a new one. Your bookings, chats and saved meals stay exactly where they are.",
         "Tippe auf den Button und wähle ein neues. Deine Buchungen, Chats und gespeicherten Gerichte bleiben, wo sie sind."),
   button=("Choose a new password", "Neues Passwort wählen"),
   note=("The link works for one hour. If you didn't ask for this, ignore this email: your password stays the same.",
         "Der Link ist eine Stunde gültig. Wenn du das nicht angefordert hast, ignoriere diese E-Mail: dein Passwort bleibt gleich."),
   subject=("Choose a new password for Bite", "Neues Passwort für Bite")),
}
HI = ("Hi", "Hallo")
FOOT = ("Home-cooked meals, shared with your neighbours.", "Hausgemachtes Essen, geteilt mit deiner Nachbarschaft.")
LINK_HELP = ("Button not working? Copy this link into your browser:", "Button funktioniert nicht? Kopiere diesen Link in deinen Browser:")
Q = ("Questions? Write to", "Fragen? Schreib an")

SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif"
SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace"

def block(t, i):
    name = f'{{{{ if .Data.name }}}}{HI[i]} {{{{ .Data.name }}}},{{{{ else }}}}{HI[i]},{{{{ end }}}}'
    return f'''<p style="margin:0 0 10px;font-family:{MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9a8bb8">{t["kicker"][i]}</p>
<h1 style="margin:0 0 14px;font-family:{SERIF};font-style:italic;font-weight:400;font-size:32px;line-height:1.15;color:#160a2e">{name} {t["title"][i]}</h1>
<p style="margin:0 0 26px;font-family:{SANS};font-size:15px;line-height:1.6;color:#4b3a6b">{t["body"][i]}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#6b21d9" style="border-radius:999px">
<a href="{{{{ .ConfirmationURL }}}}" style="display:inline-block;padding:14px 28px;font-family:{SANS};font-size:15px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:999px">{t["button"][i]} &rarr;</a>
</td></tr></table>
<p style="margin:26px 0 0;font-family:{SANS};font-size:13px;line-height:1.55;color:#7c6fa0">{t["note"][i]}</p>
<p style="margin:18px 0 0;font-family:{SANS};font-size:12px;line-height:1.5;color:#9a8bb8">{LINK_HELP[i]}<br><a href="{{{{ .ConfirmationURL }}}}" style="color:#6b21d9;word-break:break-all">{{{{ .ConfirmationURL }}}}</a></p>'''

def foot(i):
    return f'''<p style="margin:0 0 4px;font-family:{SERIF};font-style:italic;font-size:16px;color:#6b21d9">{FOOT[i]}</p>
<p style="margin:0;font-family:{MONO};font-size:11px;letter-spacing:.5px;color:#9a8bb8">{Q[i]} <a href="mailto:hello@bitetable.de" style="color:#6b21d9">hello@bitetable.de</a> &middot; <a href="https://bitetable.de/" style="color:#6b21d9">bitetable.de</a></p>'''

def page(t):
    def lang(fn):
        return f'{{{{ if and .Data.lang (eq .Data.lang "de") }}}}{fn(1)}{{{{ else }}}}{fn(0)}{{{{ end }}}}'
    return f'''<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Bite</title></head>
<body style="margin:0;padding:0;background:#f3eefb">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3eefb"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td align="center" style="padding:0 0 18px"><a href="https://bitetable.de/"><img src="https://bitetable.de/bite-icon-192.png" width="64" height="64" alt="Bite" style="display:block;border:0;border-radius:16px"></a></td></tr>
<tr><td bgcolor="#fbf7ef" style="border-radius:22px;padding:7px;box-shadow:0 10px 30px rgba(46,16,96,0.08)">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:1px dashed #d6c6f0;border-radius:16px;padding:30px 28px">
{lang(lambda i: block(t, i))}
</td></tr></table>
</td></tr>
<tr><td align="center" style="padding:22px 10px 0">
<p style="margin:0 0 14px;font-family:{MONO};font-size:12px;letter-spacing:3px;color:#c9b8e8">&middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot; &middot;</p>
{lang(foot)}
</td></tr>
</table>
</td></tr></table>
</body></html>
'''

for k, t in T.items():
    open(f"{k}.html", "w").write(page(t))
    # Supabase drops the whole template (and sends its default) if the subject uses {{ if }}: keep it plain English
    open(f"{k}.subject.txt", "w").write(t["subject"][0])
print("ok")
