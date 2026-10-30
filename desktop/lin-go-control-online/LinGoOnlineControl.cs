using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("Lin Go Gold Control Online")]
[assembly: AssemblyDescription("Linux Go Gold central online control dashboard")]
[assembly: AssemblyProduct("Lin Go Gold Control Online")]
[assembly: AssemblyCompany("Lin Go")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace LinGoGoldOnline
{
    internal static class Program
    {
        internal const string AppTitle = "Lin Go Gold Control — التحكم المركزي";
        internal const string StartUrl = "https://www.lingo.com/control";
        internal const string AllowedHost = "www.lingo.com";

        [STAThread]
        private static void Main()
        {
            AppDomain.CurrentDomain.AssemblyResolve += EmbeddedAssemblyResolver.Resolve;

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                RunApplication();
            }
            catch (Exception error)
            {
                MessageBox.Show(
                    "تعذّر بدء تطبيق التحكم المركزي.\n\n" + error.Message,
                    AppTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error,
                    MessageBoxDefaultButton.Button1,
                    MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
            }
        }

        // Keep the WebView2 references out of Main so the embedded assemblies
        // can be registered before the JIT resolves any WebView2 types.
        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunApplication()
        {
            string loaderDirectory = EmbeddedAssemblyResolver.ExtractLoader();
            CoreWebView2Environment.SetLoaderDllFolderPath(loaderDirectory);
            Application.Run(new MainForm());
        }
    }

    internal static class EmbeddedAssemblyResolver
    {
        private const string CoreAssemblyName = "Microsoft.Web.WebView2.Core";
        private const string WinFormsAssemblyName = "Microsoft.Web.WebView2.WinForms";
        private const string CoreResourceName = "Microsoft.Web.WebView2.Core.dll";
        private const string WinFormsResourceName = "Microsoft.Web.WebView2.WinForms.dll";
        private const string LoaderResourceName = "WebView2Loader.dll";

        private static Assembly _coreAssembly;
        private static Assembly _winFormsAssembly;

        internal static Assembly Resolve(object sender, ResolveEventArgs args)
        {
            string name;

            try
            {
                name = new AssemblyName(args.Name).Name;
            }
            catch
            {
                return null;
            }

            if (string.Equals(name, CoreAssemblyName, StringComparison.OrdinalIgnoreCase))
            {
                if (_coreAssembly == null)
                {
                    _coreAssembly = LoadAssembly(CoreResourceName);
                }

                return _coreAssembly;
            }

            if (string.Equals(name, WinFormsAssemblyName, StringComparison.OrdinalIgnoreCase))
            {
                if (_winFormsAssembly == null)
                {
                    _winFormsAssembly = LoadAssembly(WinFormsResourceName);
                }

                return _winFormsAssembly;
            }

            return null;
        }

        internal static string ExtractLoader()
        {
            string directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "LinGoGoldControlOnline",
                "runtime",
                "x64");

            Directory.CreateDirectory(directory);

            string target = Path.Combine(directory, LoaderResourceName);
            byte[] embedded = ReadResource(LoaderResourceName);

            if (embedded == null)
            {
                throw new InvalidOperationException("ملف WebView2Loader.dll غير موجود داخل التطبيق.");
            }

            bool needsWrite = true;

            if (File.Exists(target))
            {
                try
                {
                    byte[] existing = File.ReadAllBytes(target);
                    needsWrite = existing.Length != embedded.Length;
                }
                catch
                {
                    needsWrite = true;
                }
            }

            if (needsWrite)
            {
                File.WriteAllBytes(target, embedded);
            }

            return directory;
        }

        private static Assembly LoadAssembly(string resourceName)
        {
            byte[] bytes = ReadResource(resourceName);

            if (bytes == null)
            {
                return null;
            }

            return Assembly.Load(bytes);
        }

        private static byte[] ReadResource(string resourceName)
        {
            using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName))
            {
                if (stream == null)
                {
                    return null;
                }

                using (MemoryStream memory = new MemoryStream())
                {
                    stream.CopyTo(memory);
                    return memory.ToArray();
                }
            }
        }
    }

    internal sealed class MainForm : Form
    {
        private readonly WebView2 _webView;
        private readonly Panel _overlay;
        private readonly Label _overlayBadge;
        private readonly Label _overlayTitle;
        private readonly Label _overlayMessage;
        private readonly ProgressBar _progress;
        private readonly Button _retryButton;
        private bool _initialized;

        internal MainForm()
        {
            Text = Program.AppTitle;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(1240, 820);
            MinimumSize = new Size(900, 620);
            BackColor = Color.FromArgb(7, 13, 24);
            ForeColor = Color.FromArgb(237, 241, 247);
            KeyPreview = true;
            AutoScaleMode = AutoScaleMode.Dpi;

            try
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
                // The embedded application icon is still used by Explorer even if
                // the window icon cannot be extracted at runtime.
            }

            _webView = new WebView2();
            _webView.Dock = DockStyle.Fill;
            _webView.DefaultBackgroundColor = Color.FromArgb(7, 13, 24);
            Controls.Add(_webView);

            _overlay = new Panel();
            _overlay.Dock = DockStyle.Fill;
            _overlay.BackColor = Color.FromArgb(7, 13, 24);

            TableLayoutPanel layout = new TableLayoutPanel();
            layout.Dock = DockStyle.Fill;
            layout.ColumnCount = 1;
            layout.RowCount = 6;
            layout.Padding = new Padding(28);
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 28f));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 30f));

            _overlayBadge = new Label();
            _overlayBadge.AutoSize = true;
            _overlayBadge.Anchor = AnchorStyles.None;
            _overlayBadge.Padding = new Padding(15, 8, 15, 8);
            _overlayBadge.BackColor = Color.FromArgb(247, 199, 82);
            _overlayBadge.ForeColor = Color.FromArgb(12, 24, 40);
            _overlayBadge.Font = new Font("Segoe UI", 24f, FontStyle.Bold, GraphicsUnit.Point);
            _overlayBadge.Text = "G";
            _overlayBadge.TextAlign = ContentAlignment.MiddleCenter;
            _overlayBadge.Margin = new Padding(0, 0, 0, 16);

            _overlayTitle = new Label();
            _overlayTitle.AutoSize = true;
            _overlayTitle.Anchor = AnchorStyles.None;
            _overlayTitle.Font = new Font("Segoe UI", 20f, FontStyle.Bold, GraphicsUnit.Point);
            _overlayTitle.ForeColor = Color.FromArgb(248, 250, 252);
            _overlayTitle.Text = "Lin Go Gold Control";
            _overlayTitle.TextAlign = ContentAlignment.MiddleCenter;
            _overlayTitle.Margin = new Padding(0, 0, 0, 8);

            _overlayMessage = new Label();
            _overlayMessage.AutoSize = true;
            _overlayMessage.MaximumSize = new Size(540, 0);
            _overlayMessage.Anchor = AnchorStyles.None;
            _overlayMessage.Font = new Font("Segoe UI", 10.5f, FontStyle.Regular, GraphicsUnit.Point);
            _overlayMessage.ForeColor = Color.FromArgb(180, 195, 214);
            _overlayMessage.Text = "جارٍ الاتصال باللوحة المركزية...";
            _overlayMessage.TextAlign = ContentAlignment.MiddleCenter;
            _overlayMessage.Margin = new Padding(0, 0, 0, 18);

            _progress = new ProgressBar();
            _progress.Anchor = AnchorStyles.None;
            _progress.Size = new Size(240, 4);
            _progress.Style = ProgressBarStyle.Marquee;
            _progress.MarqueeAnimationSpeed = 28;
            _progress.Margin = new Padding(0, 0, 0, 10);

            _retryButton = new Button();
            _retryButton.Anchor = AnchorStyles.None;
            _retryButton.AutoSize = false;
            _retryButton.Size = new Size(180, 38);
            _retryButton.FlatStyle = FlatStyle.Flat;
            _retryButton.FlatAppearance.BorderSize = 0;
            _retryButton.BackColor = Color.FromArgb(247, 199, 82);
            _retryButton.ForeColor = Color.FromArgb(15, 27, 43);
            _retryButton.Font = new Font("Segoe UI", 10f, FontStyle.Bold, GraphicsUnit.Point);
            _retryButton.Text = "إعادة المحاولة";
            _retryButton.Cursor = Cursors.Hand;
            _retryButton.Visible = false;
            _retryButton.Click += RetryButton_Click;

            layout.Controls.Add(_overlayBadge, 0, 1);
            layout.Controls.Add(_overlayTitle, 0, 2);
            layout.Controls.Add(_overlayMessage, 0, 3);
            layout.Controls.Add(_progress, 0, 4);
            layout.Controls.Add(_retryButton, 0, 4);

            _overlay.Controls.Add(layout);
            Controls.Add(_overlay);
            _overlay.BringToFront();

            Shown += MainForm_Shown;
            FormClosing += MainForm_FormClosing;
            KeyDown += MainForm_KeyDown;
        }

        private async void MainForm_Shown(object sender, EventArgs e)
        {
            Shown -= MainForm_Shown;
            await InitializeWebViewAsync();
        }

        private async Task InitializeWebViewAsync()
        {
            if (_initialized)
            {
                return;
            }

            ShowLoading("جارٍ الاتصال باللوحة المركزية...", "قد تستغرق أول عملية تحميل بضع ثوانٍ.");

            try
            {
                string userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "LinGoGoldControlOnline",
                    "WebView2");

                Directory.CreateDirectory(userDataFolder);

                CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
                    null,
                    userDataFolder,
                    null);

                await _webView.EnsureCoreWebView2Async(environment);

                ConfigureWebView();
                _initialized = true;
                _webView.Source = new Uri(Program.StartUrl);
            }
            catch (Exception error)
            {
                ShowError(
                    "تعذّر فتح النسخة المركزية.",
                    "تأكد من اتصال الإنترنت ومن تثبيت Microsoft Edge WebView2 Runtime، ثم أعد المحاولة.\n\n" + error.Message);
            }
        }

        private void ConfigureWebView()
        {
            CoreWebView2 core = _webView.CoreWebView2;

            core.Settings.AreDevToolsEnabled = false;
            core.Settings.AreDefaultContextMenusEnabled = true;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.IsZoomControlEnabled = true;
            core.Settings.AreBrowserAcceleratorKeysEnabled = true;
            core.Settings.IsBuiltInErrorPageEnabled = false;

            core.NavigationStarting += Core_NavigationStarting;
            core.NavigationCompleted += Core_NavigationCompleted;
            core.NewWindowRequested += Core_NewWindowRequested;
            core.DocumentTitleChanged += Core_DocumentTitleChanged;
            core.PermissionRequested += Core_PermissionRequested;
            core.ProcessFailed += Core_ProcessFailed;
        }

        private void Core_NavigationStarting(object sender, CoreWebView2NavigationStartingEventArgs e)
        {
            Uri uri;

            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out uri))
            {
                return;
            }

            if (IsAllowedUri(uri))
            {
                return;
            }

            e.Cancel = true;
            OpenExternal(uri.ToString());
        }

        private void Core_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess)
            {
                _overlay.Visible = false;
                _webView.Visible = true;
                return;
            }

            ShowError(
                "تعذّر تحميل اللوحة المركزية.",
                "تحقق من الاتصال بالإنترنت ثم أعد المحاولة.\n\nرمز الخطأ: " + e.WebErrorStatus);
        }

        private void Core_NewWindowRequested(object sender, CoreWebView2NewWindowRequestedEventArgs e)
        {
            Uri uri;

            e.Handled = true;

            if (!Uri.TryCreate(e.Uri, UriKind.Absolute, out uri))
            {
                return;
            }

            if (IsAllowedUri(uri))
            {
                _webView.CoreWebView2.Navigate(uri.ToString());
                return;
            }

            OpenExternal(uri.ToString());
        }

        private void Core_DocumentTitleChanged(object sender, object e)
        {
            string title = _webView.CoreWebView2.DocumentTitle;

            if (string.IsNullOrWhiteSpace(title))
            {
                Text = Program.AppTitle;
                return;
            }

            Text = title;
        }

        private void Core_PermissionRequested(object sender, CoreWebView2PermissionRequestedEventArgs e)
        {
            // The only document loaded in this window is the trusted control
            // dashboard. Allowing clipboard access keeps its copy buttons usable.
            e.State = CoreWebView2PermissionState.Allow;
        }

        private void Core_ProcessFailed(object sender, CoreWebView2ProcessFailedEventArgs e)
        {
            ShowError(
                "توقفت عملية العرض.",
                "أعد فتح التطبيق. إذا تكرر الخطأ فحدّث Microsoft Edge WebView2 Runtime.\n\nالسبب: " + e.ProcessFailedKind);
        }

        private async void RetryButton_Click(object sender, EventArgs e)
        {
            if (_initialized && _webView.CoreWebView2 != null)
            {
                ShowLoading("جارٍ إعادة الاتصال...", "يتم تحديث لوحة التحكم المركزية.");
                _webView.CoreWebView2.Navigate(Program.StartUrl);
                return;
            }

            _overlay.Visible = true;
            await InitializeWebViewAsync();
        }

        private void ShowLoading(string title, string message)
        {
            _overlay.Visible = true;
            _overlay.BringToFront();
            _overlayTitle.Text = "Lin Go Gold Control";
            _overlayMessage.Text = message;
            _progress.Visible = true;
            _retryButton.Visible = false;
            Text = Program.AppTitle;
        }

        private void ShowError(string title, string message)
        {
            _overlay.Visible = true;
            _overlay.BringToFront();
            _overlayTitle.Text = title;
            _overlayMessage.Text = message;
            _progress.Visible = false;
            _retryButton.Visible = true;
        }

        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F5 || (e.Control && e.KeyCode == Keys.R))
            {
                if (_webView.CoreWebView2 != null)
                {
                    _webView.CoreWebView2.Reload();
                }

                e.Handled = true;
                e.SuppressKeyPress = true;
                return;
            }

            if (e.Alt && e.KeyCode == Keys.Left && _webView.CanGoBack)
            {
                _webView.GoBack();
                e.Handled = true;
                return;
            }

            if (e.Alt && e.KeyCode == Keys.Right && _webView.CanGoForward)
            {
                _webView.GoForward();
                e.Handled = true;
            }
        }

        private static bool IsAllowedUri(Uri uri)
        {
            return uri != null
                && string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)
                && string.Equals(uri.Host, Program.AllowedHost, StringComparison.OrdinalIgnoreCase);
        }

        private static void OpenExternal(string address)
        {
            if (string.IsNullOrWhiteSpace(address))
            {
                return;
            }

            try
            {
                Process.Start(new ProcessStartInfo(address) { UseShellExecute = true });
            }
            catch
            {
                // Ignore a failed external hand-off; the dashboard stays usable.
            }
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (_webView != null)
            {
                _webView.Dispose();
            }
        }
    }
}
