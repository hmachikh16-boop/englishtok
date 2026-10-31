# دليل النشر في المتاجر — Lin Go 1.8.3

## 1. الخلاصة والتوصية

**التوصية الحالية: Samsung Galaxy Store** كخيار مجاني معروف، مع استخدام **APK المتجر** الموقّع. لا يحتاج رسوم تسجيل أو اشتراك سنوي حسب صفحة الأسئلة الشائعة للمتجر، ويصل إلى جمهور أجهزة Samsung. أما **Google Play** فهو الأشهر عالميًا لكنه يحتاج رسوم تسجيل لمرة واحدة (25 دولارًا) واستيفاءات إضافية، وقد يعيد توقيع التطبيق إذا استُخدم Play App Signing.

**Huawei AppGallery** مجاني أيضًا، لكن يجب اختبار التعرف على الكلام وخدمات النظام على أجهزة Huawei الحديثة قبل الاعتماد عليه.

> لا يمكن للوكيل إنشاء حساب مطوّر أو قبول اتفاقية المتجر أو التحقق من الهوية نيابةً عن صاحب التطبيق. هذه خطوات يقوم بها المالك، ويمكن للوكيل تجهيز الملفات ومراجعتها.

## 2. ما الذي نرفعه؟

| الملف | الاستخدام | التحديث | صلاحية `REQUEST_INSTALL_PACKAGES` |
|---|---|---|---|
| `releases/english-tok-1.8.3.apk` | الموقع/التنزيل المباشر | يفتح المتصفح لتنزيل الحزمة | **غير مطلوبة** |
| `releases/english-tok-1.8.3-store.apk` | Samsung Galaxy Store / متاجر APK | عبر المتجر | **غير مطلوبة** |
| `releases/english-tok-1.8.3-store.aab` | Google Play / المتاجر التي تقبل AAB | عبر المتجر | **غير مطلوبة** |

**لا ترفع نسخة التوزيع المباشر إلى أي متجر.** المتاجر تمنع عادةً تنزيل APK وتثبيته خارج المتجر. نسخة المتجر تبني الويب بـ `VITE_STORE_BUILD=true` وتخفي واجهات التحديث وتستبعد صفحات تحميل APK، بينما لا تطلب أي نسخة صلاحية تثبيت الحزم بعد 1.8.3.

## 3. بناء الملفات والتحقق منها

### البناء

```powershell
# 1) نسخة التوزيع المباشر (الموقع وGitHub)
npm run android:apk

# 2) نسخة المتجر APK (Samsung وغيرها)
npm run android:apk:store

# 3) نسخة المتجر AAB (Google Play)
npm run android:aab
```

كل أمر يعيد بناء الويب ويزامن Capacitor ثم يوقّع الملف بنفس المفتاح. المخرجات في `releases/`.

### التحقق من التوقيع

استخدم `apksigner` من Android SDK build-tools:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\apksigner.bat" verify --print-certs releases\english-tok-1.8.3-store.apk
```

يجب أن تظهر بصمة SHA-256 للشهادة:
`3c224d32dbda222f400b3b5a18b1787ff99f219ba33856bf4f3d00e09307ff4e`

### التحقق من الصلاحيات

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\aapt2.exe" dump permissions releases\english-tok-1.8.3-store.apk
```

يجب ألا تظهر `android.permission.REQUEST_INSTALL_PACKAGES` في أي نسخة ابتداءً من 1.8.3. التطبيق يفتح المتصفح للتحديث ولا يثبّت الحزم بنفسه.

### التحقق من AAB

```powershell
jarsigner -verify -verbose -certs releases\english-tok-1.8.3-store.aab
```

### البصمات

```powershell
Get-FileHash releases\english-tok-1.8.3.apk -Algorithm SHA256
Get-FileHash releases\english-tok-1.8.3-store.apk -Algorithm SHA256
Get-FileHash releases\english-tok-1.8.3-store.aab -Algorithm SHA256
```

## 4. Samsung Galaxy Store

### المتطلبات

- حساب Samsung موثّق.
- حساب بائع (Seller) في Samsung Galaxy Store. التسجيل مجاني حسب صفحة الأسئلة الشائعة، لكن تحقق من الشروط الحالية.
- APK موقّع (أو AAB إذا كانت لوحة التحكم تقبل ذلك).
- أيقونة، لقطات شاشة، صورة بارزة، وصف عربي، سياسة خصوصية عامة.

### الخطوات

1. افتح `https://seller.samsungapps.com` وسجّل الدخول بحساب Samsung.
2. اختر التسجيل كبائع/مطوّر، وأكمل التحقق من البريد والهوية.
3. أضف تطبيقًا جديدًا، واختر **Android**.
4. أدخل اسم الحزمة `com.englishtok.app` والإصدار `1.8.3` وversionCode `1008003`.
5. ارفع `releases/english-tok-1.8.3-store.apk`.
6. املأ بيانات المتجر من `listing-ar.md`:
   - الاسم: Lin Go — تعلّم الإنجليزية.
   - الوصف القصير والكامل.
   - التصنيف: Education / Education > Language Learning.
   - السعر: مجاني.
   - الإعلانات: لا.
   - المشتريات: لا.
7. ارفع:
   - `store/assets/icon-512.png`
   - `store/screenshots/01-home.png`
   - `store/screenshots/02-tutor.png`
   - `store/screenshots/03-placement.png`
   - `store/assets/feature-graphic-1024x500.png`
8. أدخل رابط الخصوصية: `https://englishtok-eight.vercel.app/legal/privacy.html`.
9. أكمل تقييم المحتوى والجمهور المستهدف (راجع `content-rating-ar.md`؛ المقترح 13+).
10. أرسل للمراجعة. بعد القبول، ثبّت النسخة من المتجر واختبر التثبيت والتشغيل.

### التحديثات المستقبلية على Samsung

- ارفع APK جديدًا بنفس `applicationId` وبنفس مفتاح التوقيع، مع `versionCode` أكبر.
- لا تغيّر `applicationId` أو المفتاح، وإلا سيفشل التحديث.
- إذا رفض المتجر التحديث الذاتي، استخدم دائمًا `android:apk:store` وليس `android:apk`.

## 5. Google Play

### المتطلبات والقيود

- رسوم تسجيل لمرة واحدة: **25 دولارًا** (تحقق من السعر الحالي).
- الحسابات الشخصية الجديدة قد تحتاج **اختبارًا مغلقًا** (عدد مختبِرين ومدة يحددهما Google) قبل الإنتاج.
- **Play App Signing**: قد يعيد Google توقيع التطبيق. إذا حدث ذلك، فلن تستطيع نسخة الموقع/APK المباشر تحديث تطبيق Play بنفس الحزمة، لأن بصمة التوقيع ستختلف.
- **الخيار الآمن:** اجعل التوزيع المباشر أساسيًا، وانشر على Google Play بحزمة منفصلة (applicationId مختلف) إن أردت القناتين. هذا يحتاج تعديلًا وبناءً منفصلًا.
- **خيار آخر:** استخدم Play App Signing واقبل أن تحديثات Play تتم عبر Play فقط. لا ترفع نسخة التوزيع المباشر إلى Play.

### الخطوات

1. أنشئ حساب Google Play Console وادفع الرسوم.
2. أكمل التحقق من الهوية.
3. أنشئ تطبيقًا جديدًا بالاسم `Lin Go — تعلّم الإنجليزية`.
4. ارفع `releases/english-tok-1.8.3-store.aab` في مسار **Production** أو **Closed testing** أولًا.
5. اختر **Play App Signing** بحذر. إذا أردت الحفاظ على تحديث APK المباشر، استخدم حزمة منفصلة أو لا تنشر على Play.
6. املأ:
   - App content: Privacy policy، Ads (No)، App access (No login)، Content rating، Target audience (13+ مقترح)، Data safety من `data-safety-ar.md`.
   - Store listing: من `listing-ar.md`.
   - Graphics: الأيقونة واللقطات والصورة البارزة.
7. راجع **Pre-launch report** وأصلح أي أعطال.
8. ابدأ اختبارًا مغلقًا إذا كان مطلوبًا، ثم اطلب الإنتاج.

### ما يجب ألا يفعله إصدار Play

- لا يطلب `REQUEST_INSTALL_PACKAGES`.
- لا ينزّل APK أو يثبته.
- لا يعرض روابط تنزيل APK خارج Play.
- لا يستخدم وصفًا يخالف سياسة Metadata.
- لا يستهدف الأطفال دون استيفاء سياسات Families.

## 6. Huawei AppGallery (اختياري)

- التسجيل مجاني بشكل عام، لكن تحقق من الشروط الحالية.
- ارفع `english-tok-1.8.3-store.apk` أو AAB حسب ما تقبله لوحة التحكم.
- اختبر على جهاز Huawei بدون خدمات Google:
  - التعرف على الكلام (قد لا يتوفر).
  - تحويل النص إلى كلام (Android TTS).
  - فتح الروابط القانونية.
  - المعلم الذكي (يعتمد على الإنترنت، لا على Google Play Services).
- إذا كانت ميزات النطق الأساسية لا تعمل، لا تنشر قبل إضافة بديل أو توضيح القيود.

## 7. الجمهور المستهدف والامتثال

**المقترح: 13 سنة وما فوق.** الأسباب:
- محادثة ذكاء اصطناعي قد تنتج نصوصًا غير متوقعة.
- ميكروفون وتسجيل صوتي.
- نسخة سحابية اختيارية للاسم والتقدم.
- استهداف الأطفال يتطلب سياسات Families وموافقات إضافية.

إذا اختار المالك 13+، فلا تذكر «للعائلات» أو «للأطفال» في الوصف أو التصنيف. إذا اختار الأطفال، راجع المحتوى والموافقات وسياسة البيانات قبل الرفع.

## 8. الخصوصية والحقوق

- الصفحات القانونية منشورة على:
  - `https://englishtok-eight.vercel.app/legal/privacy.html`
  - `https://englishtok-eight.vercel.app/legal/terms.html`
  - `https://englishtok-eight.vercel.app/legal/license.html`
- الترخيص: جميع الحقوق محفوظة، مع الإشارة إلى تراخيص المكونات مفتوحة المصدر وخط Cairo (OFL 1.1).
- لا تدرج بيانات اعتماد أو مفاتيح خدمة في المتجر أو المستودع.
- احتفظ بنسخة من المفتاح و`keystore.properties` في مكان آمن؛ لا ترفعهما إلى Git.
- العلامة التجارية «Lin Go» غير مسجّلة بالضرورة؛ التسجيل مسؤولية المالك.

## 9. قائمة ما قبل الرفع

- [ ] تم بناء `english-tok-1.8.3-store.apk` و`english-tok-1.8.3-store.aab`.
- [ ] تم التحقق من التوقيع وبصمة الشهادة.
- [ ] نسخة المتجر لا تحتوي `REQUEST_INSTALL_PACKAGES`.
- [ ] نسخة المتجر لا تعرض «تحديث APK» أو روابط تنزيل APK.
- [ ] تم تثبيت نسخة المتجر على جهاز Android حقيقي واختبار:
  - [ ] الرئيسية والدروس.
  - [ ] الميكروفون والنطق.
  - [ ] المعلم الذكي.
  - [ ] تحديد المستوى.
  - [ ] النسخ الاحتياطي والاستعادة.
  - [ ] الروابط القانونية.
  - [ ] اللغة العربية وRTL.
  - [ ] عدم وجود شارة «وضع المعاينة».
- [ ] تم رفع الأيقونة واللقطات والصورة البارزة بالقياسات الصحيحة.
- [ ] الوصف لا يذكر وعودًا غير مثبتة أو «يعمل بالكامل دون اتصال».
- [ ] Privacy policy URL يعمل دون تسجيل.
- [ ] Data safety وتقييم المحتوى والجمهور المستهدف مكتملة.
- [ ] لا توجد إعلانات أو مشتريات غير مصرّح بها.
- [ ] تم قبول اتفاقية المتجر من المالك.

## 10. بعد النشر

1. ثبّت النسخة من المتجر وتأكد من أن التحديث القادم سيصل عبر المتجر.
2. راقب المراجعات والأعطال.
3. لا تغيّر مفتاح التوقيع أو `applicationId`.
4. ارفع كل إصدار جديد برقم `versionCode` أكبر.
5. حدّث سياسة الخصوصية عند تغيير المزودين أو الميزات.
6. احتفظ بنسخ من APK/AAB والبصمات وملاحظات الإصدار.

## 11. الملفات ذات الصلة

- `store/listing-ar.md`
- `store/data-safety-ar.md`
- `store/content-rating-ar.md`
- `store/README.md`
- `scripts/build-android-apk.mjs`
- `scripts/build-android-store-apk.mjs`
- `scripts/build-android-aab.mjs`
- `android/app/src/store/AndroidManifest.xml`
- `android/app/build.gradle`
