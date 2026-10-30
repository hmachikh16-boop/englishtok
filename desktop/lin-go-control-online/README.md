# Lin Go Gold Control Online

نسخة مركزية (أونلاين) من تطبيق التحكم، تعمل كتطبيق Windows (EXE) وتعرض لوحة التحكم المركزية:

https://www.lingo.com/control

## البناء

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

المتطلبات:
- Microsoft Edge WebView2 Runtime (مثبت افتراضيًا على Windows 10/11).
- اتصال بالإنترنت.

الملف الجاهز:
- `desktop/lin-go-control-online/bin/LinGoOnlineControl.exe`
- نسخة على سطح المكتب: `Lin Go Gold Control Online.exe`

## الخصوصية

- التطبيق لا يحتوي على مفتاح الإدارة.
- تسجيل الدخول يتم داخل لوحة التحكم (مفتاح `199500`).
- جلسة WebView2 محفوظة في `%LOCALAPPDATA%\LinGoGoldControlOnline\WebView2`.
