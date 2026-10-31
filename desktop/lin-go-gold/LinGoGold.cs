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

[assembly: AssemblyTitle("Lin Go Gold Desktop")]
[assembly: AssemblyDescription("Lin Go Gold web app for Windows")]
[assembly: AssemblyProduct("Lin Go Gold Desktop")]
[assembly: AssemblyCompany("Lin Go")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace LinGoGoldDesktop
{
    internal static class Program
    {
        internal const string AppTitle = "Lin Go Gold — Gold+ على Windows";
        internal const string StartUrl = "https://lingo-gold.vercel.app";
        internal const string AllowedHost = "lingo-gold.vercel.app";

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
                    "تعذّر بدء تطبيق Lin Go Gold.\n\n" + error.Message,
                    AppTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error,
                    MessageBoxDefaultButton.Button1,
                    MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunApplication()
        {
            string loaderDirectory = EmbeddedAssemblyResolver.ExtractLoader();
            CoreWebView2Environment.SetLoaderDllFolderPath(loaderDirectory);
            Application.Run(new MainForm());
        }
    }

    internal sealed class MainForm : Form
    {
        private readonly WebView2 webView = new WebView2();

        public MainForm()
        {
            Text = Program.AppTitle;
            Width = 1280;
            Height = 820;
            MinimumSize = new Size(900, 620);
            StartPosition = FormStartPosition.CenterScreen;
            Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

            webView.Dock = DockStyle.Fill;
            Controls.Add(webView);

            InitializeAsync();
        }

        private async Task InitializeAsync()
        {
            await webView.EnsureCoreWebView2Async();
            webView.CoreWebView2.NavigationStarting += delegate (object sender, CoreWebView2NavigationStartingEventArgs args)
            {
                Uri uri = null;
                if (!Uri.TryCreate(args.Uri, UriKind.Absolute, out uri)) return;
                if (!string.Equals(uri.Host, Program.AllowedHost, StringComparison.OrdinalIgnoreCase))
                {
                    args.Cancel = true;
                }
            };
            webView.Source = new Uri(Program.StartUrl);
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
            try { name = new AssemblyName(args.Name).Name; }
            catch { return null; }

            if (name == CoreAssemblyName)
            {
                if (_coreAssembly == null)
                {
                    using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(CoreResourceName))
                    {
                        if (stream == null) return null;
                        byte[] data = new byte[stream.Length];
                        stream.Read(data, 0, data.Length);
                        _coreAssembly = Assembly.Load(data);
                    }
                }
                return _coreAssembly;
            }

            if (name == WinFormsAssemblyName)
            {
                if (_winFormsAssembly == null)
                {
                    using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(WinFormsResourceName))
                    {
                        if (stream == null) return null;
                        byte[] data = new byte[stream.Length];
                        stream.Read(data, 0, data.Length);
                        _winFormsAssembly = Assembly.Load(data);
                    }
                }
                return _winFormsAssembly;
            }

            return null;
        }

        internal static string ExtractLoader()
        {
            string directory = Path.Combine(Path.GetTempPath(), "lingo-gold-desktop-loader");
            Directory.CreateDirectory(directory);
            string loaderPath = Path.Combine(directory, "WebView2Loader.dll");
            if (!File.Exists(loaderPath))
            {
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(LoaderResourceName))
                {
                    if (stream == null) throw new FileNotFoundException("WebView2Loader.dll resource was not found.");
                    using (FileStream output = File.Create(loaderPath))
                    {
                        stream.CopyTo(output);
                    }
                }
            }
            return directory;
        }
    }
}
