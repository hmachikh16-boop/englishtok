using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

[assembly: AssemblyTitle("Lin Go Gold Control")]
[assembly: AssemblyDescription("مركز محلي لإدارة أكواد Lin Go Gold والمستخدمين والتحقق من الصلاحية")]
[assembly: AssemblyCompany("Lin Go")]
[assembly: AssemblyProduct("Lin Go Gold Control")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace LinGoGoldControl
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            if (args != null && args.Any(a => string.Equals(a, "--selftest", StringComparison.OrdinalIgnoreCase)))
            {
                Environment.Exit(SelfTest.Run() ? 0 : 1);
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += delegate(object sender, System.Threading.ThreadExceptionEventArgs e)
            {
                MessageBox.Show(
                    "حدث خطأ غير متوقع:\n" + e.Exception.Message,
                    "Lin Go Gold Control",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error,
                    MessageBoxDefaultButton.Button1,
                    MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
            };

            Application.Run(new MainForm());
        }
    }

    internal static class Theme
    {
        public static readonly Color Background = Color.FromArgb(8, 14, 24);
        public static readonly Color Header = Color.FromArgb(11, 20, 34);
        public static readonly Color Card = Color.FromArgb(15, 27, 44);
        public static readonly Color CardAlt = Color.FromArgb(18, 32, 52);
        public static readonly Color Border = Color.FromArgb(40, 59, 84);
        public static readonly Color BorderSoft = Color.FromArgb(31, 48, 70);
        public static readonly Color Text = Color.FromArgb(232, 240, 249);
        public static readonly Color Muted = Color.FromArgb(148, 166, 187);
        public static readonly Color Dim = Color.FromArgb(105, 124, 146);
        public static readonly Color Gold = Color.FromArgb(247, 199, 82);
        public static readonly Color GoldDark = Color.FromArgb(190, 141, 34);
        public static readonly Color Green = Color.FromArgb(74, 222, 128);
        public static readonly Color GreenSoft = Color.FromArgb(34, 197, 94);
        public static readonly Color Blue = Color.FromArgb(96, 165, 250);
        public static readonly Color Red = Color.FromArgb(251, 113, 133);
        public static readonly Color Orange = Color.FromArgb(251, 191, 36);
        public static readonly Color Input = Color.FromArgb(10, 19, 32);

        public static readonly Font Base = new Font("Segoe UI", 9.5f, FontStyle.Regular, GraphicsUnit.Point);
        public static readonly Font Small = new Font("Segoe UI", 8.25f, FontStyle.Regular, GraphicsUnit.Point);
        public static readonly Font Tiny = new Font("Segoe UI", 7.5f, FontStyle.Regular, GraphicsUnit.Point);
        public static readonly Font Bold = new Font("Segoe UI", 9.5f, FontStyle.Bold, GraphicsUnit.Point);
        public static readonly Font Title = new Font("Segoe UI", 18f, FontStyle.Bold, GraphicsUnit.Point);
        public static readonly Font Section = new Font("Segoe UI", 10.5f, FontStyle.Bold, GraphicsUnit.Point);
        public static readonly Font Big = new Font("Segoe UI", 22f, FontStyle.Bold, GraphicsUnit.Point);
        public static readonly Font Code = new Font("Consolas", 10f, FontStyle.Bold, GraphicsUnit.Point);
    }

    internal sealed class LicenseRecord
    {
        public string Id { get; set; }
        public string Code { get; set; }
        public string Plan { get; set; }
        public int DurationDays { get; set; }
        public int DeviceLimit { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public string DeviceId { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? ActivatedAtUtc { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
        public DateTime? LastSeenAtUtc { get; set; }
        public bool Revoked { get; set; }
        public string Notes { get; set; }

        public LicenseRecord()
        {
            Id = Guid.NewGuid().ToString("N");
            Plan = "Gold";
            DeviceLimit = 1;
            CreatedAtUtc = DateTime.UtcNow;
            Notes = string.Empty;
            UserName = string.Empty;
            UserEmail = string.Empty;
            DeviceId = string.Empty;
        }
    }

    internal sealed class LicenseDatabase
    {
        public int SchemaVersion { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public List<LicenseRecord> Licenses { get; set; }

        public LicenseDatabase()
        {
            SchemaVersion = 1;
            UpdatedAtUtc = DateTime.UtcNow;
            Licenses = new List<LicenseRecord>();
        }
    }

    internal enum LicenseState
    {
        Valid,
        Active,
        Expired,
        Revoked
    }

    internal static class LicenseLogic
    {
        public const string CodePrefix = "LINGO-GOLD";
        private const string CodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        public static LicenseState GetState(LicenseRecord record)
        {
            if (record == null) return LicenseState.Revoked;
            if (record.Revoked) return LicenseState.Revoked;
            if (record.ExpiresAtUtc.HasValue && record.ExpiresAtUtc.Value <= DateTime.UtcNow)
                return LicenseState.Expired;
            if (record.ActivatedAtUtc.HasValue) return LicenseState.Active;
            return LicenseState.Valid;
        }

        public static string GetStateLabel(LicenseRecord record)
        {
            switch (GetState(record))
            {
                case LicenseState.Valid: return "صالح";
                case LicenseState.Active: return "مفعّل";
                case LicenseState.Expired: return "منتهي";
                default: return "ملغى";
            }
        }

        public static Color GetStateColor(LicenseRecord record)
        {
            switch (GetState(record))
            {
                case LicenseState.Valid: return Theme.Green;
                case LicenseState.Active: return Theme.Blue;
                case LicenseState.Expired: return Theme.Orange;
                default: return Theme.Red;
            }
        }

        public static string GetUserLabel(LicenseRecord record)
        {
            if (record == null) return string.Empty;
            if (!string.IsNullOrWhiteSpace(record.UserEmail)) return record.UserEmail.Trim();
            if (!string.IsNullOrWhiteSpace(record.UserName)) return record.UserName.Trim();
            return string.Empty;
        }

        public static bool IsExpiringSoon(LicenseRecord record)
        {
            if (record == null || record.Revoked || !record.ExpiresAtUtc.HasValue) return false;
            var remaining = record.ExpiresAtUtc.Value - DateTime.UtcNow;
            return remaining.TotalSeconds > 0 && remaining.TotalDays <= 7;
        }

        public static string FormatDate(DateTime? value)
        {
            if (!value.HasValue) return "—";
            return value.Value.ToLocalTime().ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
        }

        public static string FormatDateTime(DateTime? value)
        {
            if (!value.HasValue) return "—";
            return value.Value.ToLocalTime().ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture);
        }

        public static string FormatDuration(int days)
        {
            return days <= 0 ? "مدى الحياة" : days.ToString(CultureInfo.InvariantCulture) + " يومًا";
        }

        public static string NormalizeCode(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;
            return value.Trim().ToUpperInvariant().Replace(" ", string.Empty);
        }

        public static string NewCode(HashSet<string> existing)
        {
            for (var attempt = 0; attempt < 1000; attempt++)
            {
                var code = CodePrefix + "-" + RandomBlock(4) + "-" + RandomBlock(4) + "-" + RandomBlock(4);
                if (existing == null || !existing.Contains(code)) return code;
            }
            throw new InvalidOperationException("تعذر توليد كود فريد. أعد المحاولة.");
        }

        private static string RandomBlock(int length)
        {
            var bytes = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            var chars = new char[length];
            for (var i = 0; i < length; i++)
            {
                chars[i] = CodeAlphabet[bytes[i] % CodeAlphabet.Length];
            }
            return new string(chars);
        }
    }

    internal sealed class LicenseStore
    {
        private static readonly JavaScriptSerializer Serializer = CreateSerializer();
        public string DataDirectory { get; private set; }
        public string FilePath { get; private set; }
        public LicenseDatabase Database { get; private set; }

        public LicenseStore(string customDirectory = null)
        {
            DataDirectory = customDirectory;
            if (string.IsNullOrWhiteSpace(DataDirectory))
            {
                DataDirectory = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "LinGoGoldControl");
            }
            FilePath = Path.Combine(DataDirectory, "licenses.json");
            Database = new LicenseDatabase();
        }

        private static JavaScriptSerializer CreateSerializer()
        {
            var serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = 64 * 1024 * 1024;
            serializer.RecursionLimit = 64;
            return serializer;
        }

        public void Load()
        {
            Directory.CreateDirectory(DataDirectory);
            if (!File.Exists(FilePath))
            {
                Database = new LicenseDatabase();
                return;
            }

            try
            {
                var json = File.ReadAllText(FilePath, Encoding.UTF8);
                var loaded = Serializer.Deserialize<LicenseDatabase>(json);
                if (loaded == null) throw new InvalidDataException("empty database");
                if (loaded.Licenses == null) loaded.Licenses = new List<LicenseRecord>();
                foreach (var record in loaded.Licenses)
                {
                    NormalizeRecord(record);
                }
                Database = loaded;
            }
            catch (Exception)
            {
                var corruptPath = FilePath + ".corrupt-" + DateTime.Now.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture);
                try { File.Copy(FilePath, corruptPath, true); } catch { }
                Database = new LicenseDatabase();
            }
        }

        private static void NormalizeRecord(LicenseRecord record)
        {
            if (record == null) return;
            if (string.IsNullOrWhiteSpace(record.Id)) record.Id = Guid.NewGuid().ToString("N");
            record.Code = LicenseLogic.NormalizeCode(record.Code);
            if (string.IsNullOrWhiteSpace(record.Plan)) record.Plan = "Gold";
            if (record.DeviceLimit <= 0) record.DeviceLimit = 1;
            if (record.CreatedAtUtc == default(DateTime)) record.CreatedAtUtc = DateTime.UtcNow;
            if (record.Notes == null) record.Notes = string.Empty;
            if (record.UserName == null) record.UserName = string.Empty;
            if (record.UserEmail == null) record.UserEmail = string.Empty;
            if (record.DeviceId == null) record.DeviceId = string.Empty;
        }

        public void Save()
        {
            Directory.CreateDirectory(DataDirectory);
            Database.UpdatedAtUtc = DateTime.UtcNow;
            foreach (var record in Database.Licenses) NormalizeRecord(record);
            var json = Serializer.Serialize(Database);
            var temp = FilePath + ".tmp";
            File.WriteAllText(temp, json, new UTF8Encoding(false));
            if (File.Exists(FilePath))
            {
                try { File.Copy(FilePath, FilePath + ".bak", true); } catch { }
            }
            File.Copy(temp, FilePath, true);
            File.Delete(temp);
        }

        public string ExportJson(string targetPath)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
            var json = Serializer.Serialize(Database);
            File.WriteAllText(targetPath, json, new UTF8Encoding(false));
            return targetPath;
        }

        public int MergeJson(string sourcePath)
        {
            var json = File.ReadAllText(sourcePath, Encoding.UTF8);
            var incoming = Serializer.Deserialize<LicenseDatabase>(json);
            if (incoming == null || incoming.Licenses == null)
                throw new InvalidDataException("الملف لا يحتوي على قاعدة أكواد صالحة.");

            var existing = new HashSet<string>(
                Database.Licenses.Select(r => LicenseLogic.NormalizeCode(r.Code)),
                StringComparer.OrdinalIgnoreCase);
            var added = 0;
            foreach (var record in incoming.Licenses)
            {
                NormalizeRecord(record);
                if (string.IsNullOrWhiteSpace(record.Code) || existing.Contains(record.Code)) continue;
                existing.Add(record.Code);
                Database.Licenses.Add(record);
                added++;
            }
            if (added > 0) Save();
            return added;
        }

        public string ExportCsv(string targetPath)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
            var builder = new StringBuilder();
            builder.AppendLine("الحالة,الكود,الخطة,المدة,حد الأجهزة,المستخدم,البريد,الجهاز,تاريخ الإنشاء,تاريخ التفعيل,تاريخ الانتهاء,ملاحظات");
            foreach (var record in Database.Licenses.OrderByDescending(r => r.CreatedAtUtc))
            {
                var values = new[]
                {
                    LicenseLogic.GetStateLabel(record),
                    record.Code,
                    record.Plan,
                    LicenseLogic.FormatDuration(record.DurationDays),
                    record.DeviceLimit.ToString(CultureInfo.InvariantCulture),
                    record.UserName,
                    record.UserEmail,
                    record.DeviceId,
                    LicenseLogic.FormatDateTime(record.CreatedAtUtc),
                    LicenseLogic.FormatDateTime(record.ActivatedAtUtc),
                    LicenseLogic.FormatDateTime(record.ExpiresAtUtc),
                    record.Notes
                };
                builder.AppendLine(string.Join(",", values.Select(CsvEscape).ToArray()));
            }
            File.WriteAllText(targetPath, builder.ToString(), new UTF8Encoding(true));
            return targetPath;
        }

        private static string CsvEscape(string value)
        {
            if (value == null) return string.Empty;
            if (value.IndexOfAny(new[] { ',', '"', '\r', '\n' }) < 0) return value;
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }
    }

    internal static class SelfTest
    {
        public static bool Run()
        {
            var temp = Path.Combine(Path.GetTempPath(), "lingo-control-test-" + Guid.NewGuid().ToString("N"));
            try
            {
                var store = new LicenseStore(temp);
                store.Load();
                var code = LicenseLogic.NewCode(new HashSet<string>());
                var record = new LicenseRecord
                {
                    Code = code,
                    DurationDays = 30,
                    DeviceLimit = 1,
                    CreatedAtUtc = DateTime.UtcNow
                };
                store.Database.Licenses.Add(record);
                store.Save();

                var reloaded = new LicenseStore(temp);
                reloaded.Load();
                if (reloaded.Database.Licenses.Count != 1) return false;
                if (LicenseLogic.GetState(reloaded.Database.Licenses[0]) != LicenseState.Valid) return false;

                reloaded.Database.Licenses[0].ActivatedAtUtc = DateTime.UtcNow;
                reloaded.Database.Licenses[0].ExpiresAtUtc = DateTime.UtcNow.AddDays(30);
                reloaded.Save();
                if (LicenseLogic.GetState(reloaded.Database.Licenses[0]) != LicenseState.Active) return false;

                var csv = Path.Combine(temp, "export.csv");
                reloaded.ExportCsv(csv);
                if (!File.Exists(csv)) return false;

                var backup = Path.Combine(temp, "backup.json");
                reloaded.ExportJson(backup);
                var merged = new LicenseStore(Path.Combine(temp, "merged"));
                merged.Load();
                if (merged.MergeJson(backup) != 1) return false;
                if (merged.Database.Licenses.Count != 1) return false;

                Console.WriteLine("SELFTEST OK");
                Console.WriteLine("Code: " + code);
                Console.WriteLine("Data: " + temp);
                return true;
            }
            catch (Exception exception)
            {
                Console.Error.WriteLine("SELFTEST FAILED: " + exception);
                return false;
            }
        }
    }

    internal sealed class StatValue : Control
    {
        public Color ValueColor { get; set; }

        public StatValue()
        {
            ValueColor = Theme.Text;
            Font = Theme.Big;
            BackColor = Theme.Card;
            SetStyle(
                ControlStyles.UserPaint
                | ControlStyles.AllPaintingInWmPaint
                | ControlStyles.OptimizedDoubleBuffer
                | ControlStyles.ResizeRedraw,
                true);
        }

        protected override void OnTextChanged(EventArgs e)
        {
            base.OnTextChanged(e);
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(BackColor);
            e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var brush = new SolidBrush(ValueColor))
            using (var format = new StringFormat
            {
                Alignment = StringAlignment.Far,
                LineAlignment = StringAlignment.Center,
                FormatFlags = StringFormatFlags.NoWrap
            })
            {
                e.Graphics.DrawString(Text ?? string.Empty, Font, brush, ClientRectangle, format);
            }
        }
    }

    internal sealed class StatCaption : Control
    {
        public Color TextColor { get; set; }
        public bool VerticallyCentered { get; set; }

        public StatCaption()
        {
            TextColor = Theme.Muted;
            Font = Theme.Small;
            BackColor = Theme.Card;
            VerticallyCentered = true;
            RightToLeft = RightToLeft.No;
            SetStyle(
                ControlStyles.UserPaint
                | ControlStyles.AllPaintingInWmPaint
                | ControlStyles.OptimizedDoubleBuffer
                | ControlStyles.ResizeRedraw,
                true);
        }

        protected override void OnTextChanged(EventArgs e)
        {
            base.OnTextChanged(e);
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(BackColor);
            e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
            var flags = TextFormatFlags.Right
                | TextFormatFlags.NoPadding
                | TextFormatFlags.NoPrefix
                | TextFormatFlags.EndEllipsis;
            flags |= VerticallyCentered ? TextFormatFlags.VerticalCenter : TextFormatFlags.Top;
            TextRenderer.DrawText(e.Graphics, Text ?? string.Empty, Font, ClientRectangle, TextColor, flags);
        }
    }

    internal class CardPanel : Panel
    {
        public int Radius { get; set; }
        public Color BorderColor { get; set; }

        public CardPanel()
        {
            Radius = 16;
            BorderColor = Theme.Border;
            BackColor = Theme.Card;
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        protected override void OnResize(EventArgs eventargs)
        {
            base.OnResize(eventargs);
            if (Width <= 0 || Height <= 0) return;
            using (var path = RoundRect(new Rectangle(0, 0, Width, Height), Radius))
            {
                Region = new Region(path);
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (var path = RoundRect(new Rectangle(0, 0, Width - 1, Height - 1), Radius))
            using (var pen = new Pen(BorderColor, 1f))
            {
                e.Graphics.DrawPath(pen, path);
            }
        }

        internal static GraphicsPath RoundRect(Rectangle rect, int radius)
        {
            var path = new GraphicsPath();
            var diameter = Math.Max(1, radius * 2);
            var arc = new Rectangle(rect.Location, new Size(diameter, diameter));
            path.AddArc(arc, 180, 90);
            arc.X = rect.Right - diameter;
            path.AddArc(arc, 270, 90);
            arc.Y = rect.Bottom - diameter;
            path.AddArc(arc, 0, 90);
            arc.X = rect.Left;
            path.AddArc(arc, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    internal static class Ui
    {
        private const int EmSetCueBanner = 0x1501;

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, string lParam);

        public static void SetCue(TextBox box, string text)
        {
            if (box == null) return;
            if (box.IsHandleCreated)
            {
                SendMessage(box.Handle, EmSetCueBanner, new IntPtr(1), text);
                return;
            }
            box.HandleCreated += delegate
            {
                SendMessage(box.Handle, EmSetCueBanner, new IntPtr(1), text);
            };
        }

        public static Button Button(string text, Color backColor, Color foreColor, int width = 118, int height = 36)
        {
            var button = new Button
            {
                Text = text,
                Width = width,
                Height = height,
                FlatStyle = FlatStyle.Flat,
                BackColor = backColor,
                ForeColor = foreColor,
                Font = Theme.Bold,
                Cursor = Cursors.Hand,
                TextAlign = ContentAlignment.MiddleCenter,
                UseVisualStyleBackColor = false,
                Margin = new Padding(4, 0, 4, 0)
            };
            button.FlatAppearance.BorderSize = 0;
            return button;
        }

        public static Button OutlineButton(string text, int width = 118, int height = 36)
        {
            var button = Button(text, Theme.CardAlt, Theme.Text, width, height);
            button.FlatAppearance.BorderSize = 1;
            button.FlatAppearance.BorderColor = Theme.Border;
            return button;
        }

        public static Label Label(string text, Font font, Color color, bool autoSize = true)
        {
            return new Label
            {
                Text = text,
                Font = font,
                ForeColor = color,
                BackColor = Color.Transparent,
                AutoSize = autoSize,
                RightToLeft = RightToLeft.Yes,
                TextAlign = ContentAlignment.MiddleRight,
                Margin = new Padding(0)
            };
        }

        public static Label Muted(string text)
        {
            return Label(text, Theme.Small, Theme.Muted);
        }

        public static TextBox TextBox(bool monospace = false)
        {
            var box = new TextBox
            {
                BackColor = Theme.Input,
                ForeColor = Theme.Text,
                BorderStyle = BorderStyle.FixedSingle,
                Font = monospace ? Theme.Code : Theme.Base,
                RightToLeft = RightToLeft.Yes,
                Height = 32,
                Margin = new Padding(0)
            };
            return box;
        }

        public static ComboBox ComboBox()
        {
            var box = new ComboBox
            {
                BackColor = Theme.Input,
                ForeColor = Theme.Text,
                FlatStyle = FlatStyle.Flat,
                Font = Theme.Base,
                RightToLeft = RightToLeft.Yes,
                DropDownStyle = ComboBoxStyle.DropDownList,
                Height = 32
            };
            return box;
        }

        public static void StyleGrid(DataGridView grid)
        {
            grid.BackgroundColor = Theme.Card;
            grid.BorderStyle = BorderStyle.None;
            grid.GridColor = Theme.BorderSoft;
            grid.EnableHeadersVisualStyles = false;
            grid.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None;
            grid.ColumnHeadersDefaultCellStyle.BackColor = Theme.CardAlt;
            grid.ColumnHeadersDefaultCellStyle.ForeColor = Theme.Muted;
            grid.ColumnHeadersDefaultCellStyle.SelectionBackColor = Theme.CardAlt;
            grid.ColumnHeadersDefaultCellStyle.Font = Theme.Bold;
            grid.ColumnHeadersDefaultCellStyle.Padding = new Padding(4, 0, 4, 0);
            grid.ColumnHeadersHeight = 38;
            grid.ColumnHeadersHeightSizeMode = DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
            grid.DefaultCellStyle.BackColor = Theme.Card;
            grid.DefaultCellStyle.ForeColor = Theme.Text;
            grid.DefaultCellStyle.SelectionBackColor = Color.FromArgb(38, 57, 81);
            grid.DefaultCellStyle.SelectionForeColor = Color.White;
            grid.DefaultCellStyle.Font = Theme.Base;
            grid.DefaultCellStyle.Padding = new Padding(4, 0, 4, 0);
            grid.AlternatingRowsDefaultCellStyle.BackColor = Color.FromArgb(17, 30, 47);
            grid.RowHeadersVisible = false;
            grid.RowTemplate.Height = 38;
            grid.AllowUserToAddRows = false;
            grid.AllowUserToDeleteRows = false;
            grid.AllowUserToResizeRows = false;
            grid.ReadOnly = true;
            grid.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            grid.MultiSelect = false;
            grid.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            grid.Font = Theme.Base;
            grid.RightToLeft = RightToLeft.Yes;
        }
    }

    internal sealed class MainForm : Form
    {
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

        private readonly LicenseStore _store;
        private readonly List<LicenseRecord> _records;
        private readonly Timer _refreshTimer;
        private DataGridView _grid;
        private TextBox _searchBox;
        private ComboBox _statusFilter;
        private StatValue _statTotal;
        private StatCaption _statTotalSub;
        private StatValue _statValid;
        private StatCaption _statValidSub;
        private StatValue _statActive;
        private StatCaption _statActiveSub;
        private StatValue _statUsers;
        private StatCaption _statUsersSub;
        private StatValue _statReview;
        private StatCaption _statReviewSub;
        private Label _selectionLabel;
        private Label _statusBarLabel;
        private Label _lastRefreshLabel;
        private Label _userCountLabel;
        private ListBox _userList;
        private TextBox _checkBox;
        private Label _checkResult;
        private Button _activateButton;
        private Button _revokeButton;
        private Button _copyButton;
        private Label _dataPathLabel;
        private bool _loading;

        public MainForm()
        {
            _store = new LicenseStore();
            _store.Load();
            _records = _store.Database.Licenses;

            Text = "Lin Go Gold Control";
            StartPosition = FormStartPosition.CenterScreen;
            Size = new Size(1240, 700);
            MinimumSize = new Size(1040, 640);
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = Theme.Base;
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;
            AutoScaleMode = AutoScaleMode.Dpi;
            DoubleBuffered = true;
            try
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { }

            BuildInterface();
            RefreshAll();
            _refreshTimer = new Timer { Interval = 30000 };
            _refreshTimer.Tick += delegate { RefreshAll(); };
            _refreshTimer.Start();

            Load += delegate
            {
                if (_records.Count == 0)
                {
                    SetStatus("جاهز. أنشئ أول دفعة أكواد Gold من الزر أعلى القائمة.");
                }
                else
                {
                    SetStatus("تم تحميل " + _records.Count + " كودًا من قاعدة البيانات المحلية.");
                }
            };
            FormClosing += delegate
            {
                _refreshTimer.Stop();
                try { _store.Save(); } catch { }
            };
        }

        private void BuildInterface()
        {
            var body = BuildBody();
            body.Dock = DockStyle.Fill;
            Controls.Add(body);

            var footer = BuildFooter();
            Controls.Add(footer);

            var header = BuildHeader();
            Controls.Add(header);
        }

        protected override void OnHandleCreated(EventArgs e)
        {
            base.OnHandleCreated(e);
            try
            {
                var dark = 1;
                if (DwmSetWindowAttribute(Handle, 20, ref dark, sizeof(int)) != 0)
                {
                    DwmSetWindowAttribute(Handle, 19, ref dark, sizeof(int));
                }
            }
            catch { }
        }

        private Panel BuildHeader()
        {
            var header = new Panel
            {
                Dock = DockStyle.Top,
                Height = 96,
                BackColor = Theme.Header,
                Padding = new Padding(22, 14, 22, 12)
            };

            var accent = new Panel { Dock = DockStyle.Top, Height = 3, BackColor = Theme.Gold };
            header.Controls.Add(accent);

            var logo = new Label
            {
                Text = "G",
                Font = new Font("Segoe UI", 22f, FontStyle.Bold, GraphicsUnit.Point),
                ForeColor = Color.FromArgb(18, 29, 43),
                BackColor = Theme.Gold,
                TextAlign = ContentAlignment.MiddleCenter,
                Width = 52,
                Height = 52,
                Location = new Point(22, 24)
            };
            header.Controls.Add(logo);

            var title = Ui.Label("Lin Go Gold", Theme.Title, Color.White, false);
            title.SetBounds(86, 18, 380, 34);
            header.Controls.Add(title);

            var subtitle = Ui.Label(
                "مركز التحكم المحلي بالأكواد والمستخدمين وصلاحية الترخيص",
                Theme.Small,
                Theme.Muted,
                false);
            subtitle.SetBounds(86, 52, 520, 24);
            header.Controls.Add(subtitle);

            var mode = Ui.Label("وضع محلي — لا يرسل بيانات", Theme.Bold, Theme.Gold, false);
            mode.TextAlign = ContentAlignment.MiddleLeft;
            mode.SetBounds(Width - 330, 24, 286, 24);
            mode.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            header.Controls.Add(mode);

            var date = Ui.Label(
                DateTime.Now.ToString("dddd، d MMMM yyyy", new CultureInfo("ar")),
                Theme.Small,
                Theme.Muted,
                false);
            date.TextAlign = ContentAlignment.MiddleLeft;
            date.SetBounds(Width - 330, 49, 286, 22);
            date.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            header.Controls.Add(date);

            return header;
        }

        private Control BuildBody()
        {
            var body = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 2,
                Padding = new Padding(18, 14, 18, 12),
                BackColor = Theme.Background
            };
            body.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100f));
            body.RowStyles.Add(new RowStyle(SizeType.Absolute, 116));
            body.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));

            var stats = BuildStatsRow();
            stats.Dock = DockStyle.Fill;
            stats.Margin = new Padding(0, 0, 0, 10);
            body.Controls.Add(stats, 0, 0);

            var main = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 2,
                RowCount = 1,
                Padding = new Padding(0),
                BackColor = Theme.Background
            };
            main.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 72f));
            main.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28f));
            main.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));

            var licenses = BuildLicensesCard();
            licenses.Dock = DockStyle.Fill;
            licenses.Margin = new Padding(0, 0, 8, 0);
            main.Controls.Add(licenses, 0, 0);

            var sidebar = BuildSidebar();
            sidebar.Dock = DockStyle.Fill;
            sidebar.Margin = new Padding(8, 0, 0, 0);
            main.Controls.Add(sidebar, 1, 0);

            body.Controls.Add(main, 0, 1);
            return body;
        }

        private Control BuildStatsRow()
        {
            var row = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 5,
                RowCount = 1,
                BackColor = Theme.Background
            };
            for (var i = 0; i < 5; i++) row.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20f));
            row.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));

            row.Controls.Add(BuildStatCard("إجمالي الأكواد", Theme.Gold, out _statTotal, out _statTotalSub), 0, 0);
            row.Controls.Add(BuildStatCard("صالحة للتفعيل", Theme.Green, out _statValid, out _statValidSub), 1, 0);
            row.Controls.Add(BuildStatCard("مفعّلة الآن", Theme.Blue, out _statActive, out _statActiveSub), 2, 0);
            row.Controls.Add(BuildStatCard("المستخدمون", Color.FromArgb(192, 132, 252), out _statUsers, out _statUsersSub), 3, 0);
            row.Controls.Add(BuildStatCard("تحتاج مراجعة", Theme.Orange, out _statReview, out _statReviewSub), 4, 0);
            return row;
        }

        private static Control BuildStatCard(string title, Color accent, out StatValue value, out StatCaption sub)
        {
            var card = new CardPanel
            {
                Dock = DockStyle.Fill,
                Margin = new Padding(4, 0, 4, 0),
                Padding = new Padding(14, 10, 14, 10),
                BackColor = Theme.Card,
                BorderColor = Color.FromArgb(58, accent)
            };
            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 3,
                BackColor = Theme.Card
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));

            value = new StatValue
            {
                Text = "0",
                ValueColor = accent,
                Dock = DockStyle.Fill,
                Margin = new Padding(0)
            };
            layout.Controls.Add(value, 0, 0);

            var titleLabel = new StatCaption
            {
                Text = title,
                Font = Theme.Bold,
                TextColor = Theme.Text,
                Dock = DockStyle.Fill,
                VerticallyCentered = true,
                Margin = new Padding(0)
            };
            layout.Controls.Add(titleLabel, 0, 1);

            sub = new StatCaption
            {
                Text = "—",
                Font = Theme.Tiny,
                TextColor = Theme.Dim,
                Dock = DockStyle.Fill,
                VerticallyCentered = false,
                Margin = new Padding(0)
            };
            layout.Controls.Add(sub, 0, 2);

            card.Controls.Add(layout);
            return card;
        }

        private Control BuildLicensesCard()
        {
            var card = new CardPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(14),
                BackColor = Theme.Card
            };

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                BackColor = Theme.Card
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 46));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
            card.Controls.Add(layout);

            var toolbar = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                BackColor = Theme.Card,
                Padding = new Padding(0, 2, 0, 0)
            };

            var create = Ui.Button("+  إنشاء أكواد", Theme.Gold, Color.FromArgb(19, 29, 43), 140, 36);
            create.Click += delegate { GenerateCodes(); };
            toolbar.Controls.Add(create);

            var refresh = Ui.OutlineButton("تحديث", 86);
            refresh.Click += delegate { RefreshAll(); SetStatus("تم تحديث القائمة والحالات."); };
            toolbar.Controls.Add(refresh);

            var export = Ui.OutlineButton("تصدير CSV", 100);
            export.Click += delegate { ExportCsv(); };
            toolbar.Controls.Add(export);

            var backup = Ui.OutlineButton("نسخة احتياطية", 118);
            backup.Click += delegate { BackupJson(); };
            toolbar.Controls.Add(backup);

            var import = Ui.OutlineButton("استيراد", 90);
            import.Click += delegate { ImportJson(); };
            toolbar.Controls.Add(import);

            layout.Controls.Add(toolbar, 0, 0);

            var filters = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 3,
                RowCount = 1,
                BackColor = Theme.Card
            };
            filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 55f));
            filters.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 30f));
            filters.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, 92f));

            _searchBox = Ui.TextBox();
            _searchBox.Dock = DockStyle.Fill;
            _searchBox.Margin = new Padding(0, 4, 0, 4);
            Ui.SetCue(_searchBox, "ابحث بالكود أو المستخدم أو الجهاز…");
            _searchBox.TextChanged += delegate { RefreshGrid(); };
            _searchBox.KeyDown += delegate(object sender, KeyEventArgs e)
            {
                if (e.KeyCode == Keys.Escape)
                {
                    _searchBox.Clear();
                    e.SuppressKeyPress = true;
                }
            };

            _statusFilter = Ui.ComboBox();
            _statusFilter.Dock = DockStyle.Fill;
            _statusFilter.Margin = new Padding(8, 4, 0, 4);
            _statusFilter.Items.AddRange(new object[] { "الكل", "صالحة", "مفعّلة", "تنتهي قريبًا", "منتهية", "ملغاة" });
            _statusFilter.SelectedIndex = 0;
            _statusFilter.SelectedIndexChanged += delegate { RefreshGrid(); };

            var clear = Ui.OutlineButton("مسح", 82, 30);
            clear.Dock = DockStyle.Fill;
            clear.Margin = new Padding(8, 4, 0, 4);
            clear.Click += delegate
            {
                _searchBox.Clear();
                _statusFilter.SelectedIndex = 0;
            };

            filters.Controls.Add(_searchBox, 0, 0);
            filters.Controls.Add(_statusFilter, 1, 0);
            filters.Controls.Add(clear, 2, 0);
            layout.Controls.Add(filters, 0, 1);

            _grid = new DataGridView { Dock = DockStyle.Fill, Margin = new Padding(0, 4, 0, 0) };
            Ui.StyleGrid(_grid);
            _grid.Columns.Add(NewColumn("status", "الحالة", 10, 64));
            _grid.Columns.Add(NewColumn("code", "الكود", 32, 220));
            _grid.Columns.Add(NewColumn("user", "المستخدم", 20, 120));
            _grid.Columns.Add(NewColumn("expires", "الانتهاء", 13, 98));
            _grid.Columns.Add(NewColumn("limits", "الأجهزة", 8, 58));
            _grid.Columns.Add(NewColumn("notes", "ملاحظات", 17, 100));
            _grid.CellFormatting += GridCellFormatting;
            _grid.CellToolTipTextNeeded += delegate(object sender, DataGridViewCellToolTipTextNeededEventArgs e)
            {
                if (e.RowIndex < 0 || e.RowIndex >= _grid.Rows.Count) return;
                var record = _grid.Rows[e.RowIndex].Tag as LicenseRecord;
                if (record == null) return;
                if (e.ColumnIndex == 1) e.ToolTipText = record.Code;
                else if (e.ColumnIndex == 2)
                {
                    e.ToolTipText = LicenseLogic.GetUserLabel(record)
                        + (string.IsNullOrWhiteSpace(record.DeviceId) ? string.Empty : "\nالجهاز: " + record.DeviceId)
                        + "\nفُعّل: " + LicenseLogic.FormatDateTime(record.ActivatedAtUtc);
                }
                else if (e.ColumnIndex == 5 && !string.IsNullOrWhiteSpace(record.Notes))
                {
                    e.ToolTipText = record.Notes;
                }
            };
            _grid.SelectionChanged += delegate { UpdateSelectionActions(); };
            _grid.CellDoubleClick += delegate(object sender, DataGridViewCellEventArgs e)
            {
                if (e.RowIndex >= 0) ShowDetails();
            };
            _grid.KeyDown += delegate(object sender, KeyEventArgs e)
            {
                if (e.Control && e.KeyCode == Keys.C) { CopySelectedCode(); e.SuppressKeyPress = true; }
                if (e.KeyCode == Keys.Enter) { ShowDetails(); e.SuppressKeyPress = true; }
            };
            _grid.MouseDown += delegate(object sender, MouseEventArgs e)
            {
                if (e.Button == MouseButtons.Right)
                {
                    var hit = _grid.HitTest(e.X, e.Y);
                    if (hit.RowIndex >= 0)
                    {
                        _grid.ClearSelection();
                        _grid.Rows[hit.RowIndex].Selected = true;
                        _grid.CurrentCell = _grid.Rows[hit.RowIndex].Cells[1];
                    }
                }
            };

            var menu = BuildGridMenu();
            _grid.ContextMenuStrip = menu;
            layout.Controls.Add(_grid, 0, 2);

            var selectionBar = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Theme.Card,
                Padding = new Padding(0, 5, 0, 0)
            };
            _selectionLabel = Ui.Label("حدد كودًا لعرض الإجراءات السريعة", Theme.Small, Theme.Muted, false);
            _selectionLabel.Dock = DockStyle.Right;
            _selectionLabel.Width = 410;
            _selectionLabel.TextAlign = ContentAlignment.MiddleLeft;
            selectionBar.Controls.Add(_selectionLabel);

            _copyButton = Ui.OutlineButton("نسخ", 68, 30);
            _copyButton.Dock = DockStyle.Left;
            _copyButton.Click += delegate { CopySelectedCode(); };
            selectionBar.Controls.Add(_copyButton);

            _revokeButton = Ui.OutlineButton("إلغاء", 78, 30);
            _revokeButton.Dock = DockStyle.Left;
            _revokeButton.Click += delegate { ToggleRevoke(); };
            selectionBar.Controls.Add(_revokeButton);

            _activateButton = Ui.Button("تفعيل / تعيين", Theme.GreenSoft, Color.FromArgb(8, 30, 18), 118, 30);
            _activateButton.Dock = DockStyle.Left;
            _activateButton.Click += delegate { ActivateSelected(); };
            selectionBar.Controls.Add(_activateButton);

            layout.Controls.Add(selectionBar, 0, 3);
            return card;
        }

        private static DataGridViewTextBoxColumn NewColumn(string name, string title, int weight, int minimum)
        {
            return new DataGridViewTextBoxColumn
            {
                Name = name,
                HeaderText = title,
                FillWeight = weight,
                MinimumWidth = minimum,
                SortMode = DataGridViewColumnSortMode.NotSortable,
                DefaultCellStyle = new DataGridViewCellStyle
                {
                    Alignment = DataGridViewContentAlignment.MiddleRight,
                    NullValue = "—"
                }
            };
        }

        private ContextMenuStrip BuildGridMenu()
        {
            var menu = new ContextMenuStrip
            {
                BackColor = Theme.CardAlt,
                ForeColor = Theme.Text,
                Font = Theme.Base,
                RightToLeft = RightToLeft.Yes,
                ShowImageMargin = false
            };
            menu.Items.Add("تفعيل / تعيين مستخدم…", null, delegate { ActivateSelected(); });
            menu.Items.Add("إلغاء التفعيل", null, delegate { DeactivateSelected(); });
            menu.Items.Add("تمديد 30 يومًا", null, delegate { ExtendSelected(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("نسخ الكود", null, delegate { CopySelectedCode(); });
            menu.Items.Add("تعديل الملاحظات…", null, delegate { EditNotes(); });
            menu.Items.Add("عرض التفاصيل", null, delegate { ShowDetails(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("إلغاء الكود / إعادة تنشيطه", null, delegate { ToggleRevoke(); });
            menu.Items.Add("حذف الكود", null, delegate { DeleteSelected(); });
            return menu;
        }

        private Control BuildSidebar()
        {
            var sidebar = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.TopDown,
                WrapContents = false,
                AutoScroll = true,
                BackColor = Theme.Background,
                Padding = new Padding(0)
            };

            var check = BuildCheckCard();
            check.Dock = DockStyle.None;
            check.Margin = new Padding(0, 0, 0, 10);
            check.Height = 232;
            sidebar.Controls.Add(check);

            var users = BuildUsersCard();
            users.Dock = DockStyle.None;
            users.Margin = new Padding(0, 0, 0, 10);
            users.Height = 172;
            sidebar.Controls.Add(users);

            var data = BuildDataCard();
            data.Dock = DockStyle.None;
            data.Margin = new Padding(0, 0, 0, 0);
            data.Height = 214;
            sidebar.Controls.Add(data);

            sidebar.Resize += delegate
            {
                var width = sidebar.ClientSize.Width - SystemInformation.VerticalScrollBarWidth - 6;
                if (width < 220) width = 220;
                foreach (Control control in sidebar.Controls)
                {
                    control.Width = width;
                }
            };
            return sidebar;
        }

        private Control BuildCheckCard()
        {
            var card = new CardPanel
            {
                Dock = DockStyle.Fill,
                Margin = new Padding(0, 0, 0, 10),
                Padding = new Padding(14),
                BackColor = Theme.Card
            };

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 5,
                BackColor = Theme.Card
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 22));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 38));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 40));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            card.Controls.Add(layout);

            var title = Ui.Label("فحص كود سريع", Theme.Section, Color.White, false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            var hint = Ui.Label("تحقق من صلاحية أي كود ومستخدمه وجهازه وانتهائه.", Theme.Tiny, Theme.Muted, false);
            hint.Dock = DockStyle.Fill;
            hint.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(hint, 0, 1);

            _checkBox = Ui.TextBox(true);
            _checkBox.Dock = DockStyle.Fill;
            _checkBox.Margin = new Padding(0, 3, 0, 3);
            _checkBox.CharacterCasing = CharacterCasing.Upper;
            Ui.SetCue(_checkBox, "LINGO-GOLD-XXXX-XXXX-XXXX");
            _checkBox.KeyDown += delegate(object sender, KeyEventArgs e)
            {
                if (e.KeyCode == Keys.Enter)
                {
                    CheckCode();
                    e.SuppressKeyPress = true;
                }
            };
            layout.Controls.Add(_checkBox, 0, 2);

            var checkButton = Ui.Button("تحقق من الكود", Theme.Gold, Color.FromArgb(20, 30, 43), 140, 32);
            checkButton.Dock = DockStyle.Fill;
            checkButton.Margin = new Padding(0, 2, 0, 4);
            checkButton.Click += delegate { CheckCode(); };
            layout.Controls.Add(checkButton, 0, 3);

            _checkResult = new Label
            {
                Dock = DockStyle.Fill,
                BackColor = Theme.Input,
                ForeColor = Theme.Muted,
                Font = Theme.Tiny,
                TextAlign = ContentAlignment.MiddleLeft,
                Padding = new Padding(10),
                Text = "أدخل كودًا ثم اضغط «تحقق».\nالفحص يعمل محليًا على قاعدة البيانات."
            };
            layout.Controls.Add(_checkResult, 0, 4);
            return card;
        }

        private Control BuildUsersCard()
        {
            var card = new CardPanel
            {
                Dock = DockStyle.Fill,
                Margin = new Padding(0, 0, 0, 10),
                Padding = new Padding(14),
                BackColor = Theme.Card
            };

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 3,
                BackColor = Theme.Card
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 20));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            card.Controls.Add(layout);

            var title = Ui.Label("المستخدمون المفعّلون", Theme.Section, Color.White, false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            _userCountLabel = Ui.Label("0 مستخدم · 0 جهاز", Theme.Tiny, Theme.Muted, false);
            _userCountLabel.Dock = DockStyle.Fill;
            _userCountLabel.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(_userCountLabel, 0, 1);

            _userList = new ListBox
            {
                Dock = DockStyle.Fill,
                BackColor = Theme.Input,
                ForeColor = Theme.Text,
                BorderStyle = BorderStyle.None,
                Font = Theme.Small,
                IntegralHeight = false,
                ItemHeight = 24,
                RightToLeft = RightToLeft.Yes
            };
            layout.Controls.Add(_userList, 0, 2);
            return card;
        }

        private Control BuildDataCard()
        {
            var card = new CardPanel
            {
                Dock = DockStyle.Fill,
                Margin = new Padding(0),
                Padding = new Padding(14),
                BackColor = Theme.Card
            };

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 5,
                BackColor = Theme.Card
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 40));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            card.Controls.Add(layout);

            var title = Ui.Label("بيانات التحكم", Theme.Section, Color.White, false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            _dataPathLabel = Ui.Label(_store.FilePath, Theme.Tiny, Theme.Muted, false);
            _dataPathLabel.Dock = DockStyle.Fill;
            _dataPathLabel.AutoEllipsis = true;
            _dataPathLabel.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(_dataPathLabel, 0, 1);

            var open = Ui.OutlineButton("فتح مجلد البيانات", 148, 30);
            open.Dock = DockStyle.Right;
            open.Click += delegate { OpenDataFolder(); };
            layout.Controls.Add(open, 0, 2);

            var copy = Ui.OutlineButton("نسخ المسار", 114, 30);
            copy.Dock = DockStyle.Right;
            copy.Click += delegate
            {
                Clipboard.SetText(_store.FilePath);
                SetStatus("تم نسخ مسار قاعدة البيانات.");
            };
            layout.Controls.Add(copy, 0, 3);

            var note = Ui.Label(
                "قاعدة محلية مستقلة. لا تُرسل الأكواد أو بيانات المستخدمين إلى أي خادم.\n"
                + "استخدم «نسخة احتياطية» بانتظام، ويمكن استيرادها على جهاز آخر.\n\n"
                + "الإصدار 1.0 · Lin Go Gold Control",
                Theme.Tiny,
                Theme.Dim,
                false);
            note.Dock = DockStyle.Fill;
            note.TextAlign = ContentAlignment.TopLeft;
            layout.Controls.Add(note, 0, 4);
            return card;
        }

        private Panel BuildFooter()
        {
            var footer = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 32,
                BackColor = Theme.Header,
                Padding = new Padding(18, 0, 18, 0)
            };
            var topLine = new Panel { Dock = DockStyle.Top, Height = 1, BackColor = Theme.BorderSoft };
            footer.Controls.Add(topLine);

            _statusBarLabel = Ui.Label("جاهز", Theme.Tiny, Theme.Muted, false);
            _statusBarLabel.Dock = DockStyle.Right;
            _statusBarLabel.Width = 620;
            _statusBarLabel.TextAlign = ContentAlignment.MiddleLeft;
            footer.Controls.Add(_statusBarLabel);

            _lastRefreshLabel = Ui.Label("آخر تحديث: —", Theme.Tiny, Theme.Dim, false);
            _lastRefreshLabel.Dock = DockStyle.Left;
            _lastRefreshLabel.Width = 220;
            _lastRefreshLabel.TextAlign = ContentAlignment.MiddleLeft;
            footer.Controls.Add(_lastRefreshLabel);
            return footer;
        }

        private void RefreshAll()
        {
            if (_loading) return;
            _loading = true;
            try
            {
                RefreshStats();
                RefreshGrid();
                RefreshUsers();
                _lastRefreshLabel.Text = "آخر تحديث: " + DateTime.Now.ToString("HH:mm:ss", CultureInfo.InvariantCulture);
            }
            finally
            {
                _loading = false;
            }
        }

        private void RefreshStats()
        {
            var total = _records.Count;
            var valid = _records.Count(r => LicenseLogic.GetState(r) == LicenseState.Valid);
            var active = _records.Count(r => LicenseLogic.GetState(r) == LicenseState.Active);
            var expired = _records.Count(r => LicenseLogic.GetState(r) == LicenseState.Expired);
            var revoked = _records.Count(r => LicenseLogic.GetState(r) == LicenseState.Revoked);
            var expiring = _records.Count(LicenseLogic.IsExpiringSoon);
            var users = _records.Where(r => LicenseLogic.GetState(r) == LicenseState.Active)
                .Select(LicenseLogic.GetUserLabel)
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            _statTotal.Text = total.ToString(CultureInfo.InvariantCulture);
            _statTotalSub.Text = total == 0 ? "لا توجد أكواد بعد" : "كل الأكواد المحفوظة";
            _statValid.Text = valid.ToString(CultureInfo.InvariantCulture);
            _statValidSub.Text = valid == 0 ? "بانتظار التوليد" : "جاهزة للبيع أو التفعيل";
            _statActive.Text = active.ToString(CultureInfo.InvariantCulture);
            _statActiveSub.Text = active == 0 ? "لا يوجد تفعيل بعد" : "مستخدمة الآن";
            _statUsers.Text = users.ToString(CultureInfo.InvariantCulture);
            _statUsersSub.Text = users == 0 ? "سيظهرون بعد التفعيل" : "حسب البريد أو الاسم";
            _statReview.Text = (expired + revoked + expiring).ToString(CultureInfo.InvariantCulture);
            if (expiring > 0)
                _statReviewSub.Text = expiring + " تنتهي خلال 7 أيام";
            else
                _statReviewSub.Text = expired + " منتهي · " + revoked + " ملغى";
        }

        private void RefreshGrid()
        {
            if (_grid == null) return;
            var selectedCode = SelectedRecord != null ? SelectedRecord.Code : null;
            var query = (_searchBox != null ? _searchBox.Text : string.Empty).Trim();
            var filter = _statusFilter != null ? Convert.ToString(_statusFilter.SelectedItem) : "الكل";

            IEnumerable<LicenseRecord> filtered = _records;
            if (!string.IsNullOrWhiteSpace(query))
            {
                filtered = filtered.Where(r =>
                    (r.Code ?? string.Empty).IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0
                    || (r.UserName ?? string.Empty).IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0
                    || (r.UserEmail ?? string.Empty).IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0
                    || (r.DeviceId ?? string.Empty).IndexOf(query, StringComparison.OrdinalIgnoreCase) >= 0);
            }

            if (filter == "صالحة") filtered = filtered.Where(r => LicenseLogic.GetState(r) == LicenseState.Valid);
            else if (filter == "مفعّلة") filtered = filtered.Where(r => LicenseLogic.GetState(r) == LicenseState.Active);
            else if (filter == "تنتهي قريبًا") filtered = filtered.Where(LicenseLogic.IsExpiringSoon);
            else if (filter == "منتهية") filtered = filtered.Where(r => LicenseLogic.GetState(r) == LicenseState.Expired);
            else if (filter == "ملغاة") filtered = filtered.Where(r => LicenseLogic.GetState(r) == LicenseState.Revoked);

            var view = filtered.OrderByDescending(r => r.CreatedAtUtc).ToList();
            _grid.SuspendLayout();
            try
            {
                _grid.Rows.Clear();
                foreach (var record in view)
                {
                    var index = _grid.Rows.Add(
                        LicenseLogic.GetStateLabel(record),
                        record.Code,
                        LicenseLogic.GetUserLabel(record),
                        LicenseLogic.FormatDate(record.ExpiresAtUtc),
                        record.DeviceLimit.ToString(CultureInfo.InvariantCulture),
                        record.Notes);
                    _grid.Rows[index].Tag = record;
                    if (selectedCode != null && string.Equals(record.Code, selectedCode, StringComparison.OrdinalIgnoreCase))
                    {
                        _grid.Rows[index].Selected = true;
                        _grid.CurrentCell = _grid.Rows[index].Cells[1];
                    }
                }
            }
            finally
            {
                _grid.ResumeLayout();
            }
            UpdateSelectionActions();
        }

        private void RefreshUsers()
        {
            if (_userList == null) return;
            var active = _records.Where(r => LicenseLogic.GetState(r) == LicenseState.Active).ToList();
            var users = active
                .Select(r => new
                {
                    Label = LicenseLogic.GetUserLabel(r),
                    Device = r.DeviceId,
                    Code = r.Code
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.Label))
                .GroupBy(x => x.Label, StringComparer.OrdinalIgnoreCase)
                .Select(g => g.First())
                .OrderBy(x => x.Label)
                .ToList();
            var devices = active
                .Select(r => r.DeviceId)
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count();

            _userCountLabel.Text = users.Count.ToString(CultureInfo.InvariantCulture) + " مستخدم · "
                + devices.ToString(CultureInfo.InvariantCulture) + " جهاز";
            _userList.BeginUpdate();
            try
            {
                _userList.Items.Clear();
                if (users.Count == 0)
                {
                    _userList.Items.Add("لا يوجد مستخدمون مفعّلون بعد");
                }
                else
                {
                    foreach (var user in users)
                    {
                        _userList.Items.Add(user.Label + "  ·  " + user.Code.Substring(Math.Max(0, user.Code.Length - 9)));
                    }
                }
            }
            finally
            {
                _userList.EndUpdate();
            }
        }

        private LicenseRecord SelectedRecord
        {
            get
            {
                if (_grid == null || _grid.CurrentRow == null) return null;
                return _grid.CurrentRow.Tag as LicenseRecord;
            }
        }

        private void UpdateSelectionActions()
        {
            var record = SelectedRecord;
            var enabled = record != null;
            if (_activateButton != null) _activateButton.Enabled = enabled && LicenseLogic.GetState(record) != LicenseState.Revoked;
            if (_revokeButton != null)
            {
                _revokeButton.Enabled = enabled;
                _revokeButton.Text = enabled && record.Revoked ? "إعادة تنشيط" : "إلغاء";
            }
            if (_copyButton != null) _copyButton.Enabled = enabled;
            if (_selectionLabel != null)
            {
                if (record == null)
                {
                    _selectionLabel.Text = "حدد كودًا لعرض الإجراءات السريعة";
                    _selectionLabel.ForeColor = Theme.Muted;
                }
                else
                {
                    _selectionLabel.Text = record.Code + " · " + LicenseLogic.GetStateLabel(record)
                        + (string.IsNullOrWhiteSpace(LicenseLogic.GetUserLabel(record)) ? "" : " · " + LicenseLogic.GetUserLabel(record));
                    _selectionLabel.ForeColor = LicenseLogic.GetStateColor(record);
                }
            }
        }

        private void GridCellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            if (e.RowIndex < 0 || e.RowIndex >= _grid.Rows.Count) return;
            var record = _grid.Rows[e.RowIndex].Tag as LicenseRecord;
            if (record == null) return;
            var state = LicenseLogic.GetState(record);
            if (_grid.Columns[e.ColumnIndex].Name == "status")
            {
                e.CellStyle.ForeColor = LicenseLogic.GetStateColor(record);
                e.CellStyle.Font = Theme.Bold;
            }
            if (state == LicenseState.Expired || state == LicenseState.Revoked)
            {
                if (_grid.Columns[e.ColumnIndex].Name != "status")
                    e.CellStyle.ForeColor = Theme.Dim;
            }
            if (_grid.Columns[e.ColumnIndex].Name == "code")
            {
                e.CellStyle.Font = Theme.Code;
            }
        }

        private void GenerateCodes()
        {
            using (var dialog = new GenerateDialog())
            {
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                var existing = new HashSet<string>(_records.Select(r => LicenseLogic.NormalizeCode(r.Code)), StringComparer.OrdinalIgnoreCase);
                var generated = new List<LicenseRecord>();
                for (var i = 0; i < dialog.CodeCount; i++)
                {
                    var record = new LicenseRecord
                    {
                        Code = LicenseLogic.NewCode(existing),
                        DurationDays = dialog.DurationDays,
                        DeviceLimit = dialog.DeviceLimit,
                        Notes = dialog.Notes,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    existing.Add(record.Code);
                    _records.Add(record);
                    generated.Add(record);
                }
                SaveAndRefresh();
                SetStatus("تم إنشاء " + generated.Count + " كودًا جديدًا. انسخها أو صدّرها من نافذة النتائج.");
                using (var result = new GeneratedCodesDialog(generated))
                {
                    result.ShowDialog(this);
                }
            }
        }

        private void ActivateSelected()
        {
            var record = SelectedRecord;
            if (record == null) return;
            if (record.Revoked)
            {
                MessageBox.Show("هذا الكود ملغى. أعد تنشيطه أولًا.", "Lin Go Gold Control", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            using (var dialog = new ActivateDialog(record))
            {
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                var wasExpired = LicenseLogic.GetState(record) == LicenseState.Expired;
                record.UserName = dialog.UserName;
                record.UserEmail = dialog.UserEmail;
                record.DeviceId = dialog.DeviceId;
                if (!record.ActivatedAtUtc.HasValue || wasExpired)
                {
                    record.ActivatedAtUtc = DateTime.UtcNow;
                    record.ExpiresAtUtc = record.DurationDays > 0
                        ? DateTime.UtcNow.AddDays(record.DurationDays)
                        : (DateTime?)null;
                }
                record.LastSeenAtUtc = DateTime.UtcNow;
                if (!string.IsNullOrWhiteSpace(dialog.Notes)) record.Notes = dialog.Notes;
                SaveAndRefresh();
                SetStatus("تم تفعيل الكود " + record.Code + " محليًا.");
            }
        }

        private void DeactivateSelected()
        {
            var record = SelectedRecord;
            if (record == null) return;
            if (!record.ActivatedAtUtc.HasValue)
            {
                SetStatus("هذا الكود غير مفعّل أصلًا.");
                return;
            }
            if (MessageBox.Show(
                    "إلغاء تفعيل الكود " + record.Code + "؟\nسيعود إلى حالة «صالح» ويمكن تعيينه لمستخدم آخر.",
                    "تأكيد إلغاء التفعيل",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question,
                    MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
            record.ActivatedAtUtc = null;
            record.ExpiresAtUtc = null;
            record.UserName = string.Empty;
            record.UserEmail = string.Empty;
            record.DeviceId = string.Empty;
            record.LastSeenAtUtc = null;
            SaveAndRefresh();
            SetStatus("تم إلغاء تفعيل " + record.Code + ".");
        }

        private void ExtendSelected()
        {
            var record = SelectedRecord;
            if (record == null) return;
            if (!record.ActivatedAtUtc.HasValue)
            {
                SetStatus("لا يمكن تمديد كود غير مفعّل. فعّله أولًا.");
                return;
            }
            if (record.DurationDays <= 0)
            {
                SetStatus("هذا الكود مدى الحياة ولا يحتاج تمديدًا.");
                return;
            }
            var baseDate = record.ExpiresAtUtc.HasValue && record.ExpiresAtUtc.Value > DateTime.UtcNow
                ? record.ExpiresAtUtc.Value
                : DateTime.UtcNow;
            record.ExpiresAtUtc = baseDate.AddDays(30);
            SaveAndRefresh();
            SetStatus("تم تمديد " + record.Code + " حتى " + LicenseLogic.FormatDate(record.ExpiresAtUtc) + ".");
        }

        private void ToggleRevoke()
        {
            var record = SelectedRecord;
            if (record == null) return;
            if (!record.Revoked)
            {
                if (MessageBox.Show(
                        "إلغاء الكود " + record.Code + "؟\nلن يظهر كصالح أو مفعّل، ويمكنك إعادة تنشيطه لاحقًا.",
                        "تأكيد إلغاء الكود",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Warning,
                        MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
                record.Revoked = true;
                SetStatus("تم إلغاء الكود " + record.Code + ".");
            }
            else
            {
                record.Revoked = false;
                SetStatus("تمت إعادة تنشيط الكود " + record.Code + ".");
            }
            SaveAndRefresh();
        }

        private void CopySelectedCode()
        {
            var record = SelectedRecord;
            if (record == null) return;
            Clipboard.SetText(record.Code);
            SetStatus("تم نسخ الكود " + record.Code + ".");
        }

        private void EditNotes()
        {
            var record = SelectedRecord;
            if (record == null) return;
            using (var dialog = new NotesDialog(record))
            {
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                record.Notes = dialog.Notes;
                SaveAndRefresh();
                SetStatus("تم تحديث ملاحظات " + record.Code + ".");
            }
        }

        private void ShowDetails()
        {
            var record = SelectedRecord;
            if (record == null) return;
            var message = "الكود: " + record.Code + "\n"
                + "الحالة: " + LicenseLogic.GetStateLabel(record) + "\n"
                + "الخطة: " + record.Plan + "\n"
                + "المدة: " + LicenseLogic.FormatDuration(record.DurationDays) + "\n"
                + "حد الأجهزة: " + record.DeviceLimit + "\n"
                + "المستخدم: " + (string.IsNullOrWhiteSpace(LicenseLogic.GetUserLabel(record)) ? "—" : LicenseLogic.GetUserLabel(record)) + "\n"
                + "الاسم: " + (string.IsNullOrWhiteSpace(record.UserName) ? "—" : record.UserName) + "\n"
                + "الجهاز: " + (string.IsNullOrWhiteSpace(record.DeviceId) ? "—" : record.DeviceId) + "\n"
                + "أُنشئ: " + LicenseLogic.FormatDateTime(record.CreatedAtUtc) + "\n"
                + "فُعّل: " + LicenseLogic.FormatDateTime(record.ActivatedAtUtc) + "\n"
                + "ينتهي: " + LicenseLogic.FormatDateTime(record.ExpiresAtUtc) + "\n"
                + "آخر ظهور: " + LicenseLogic.FormatDateTime(record.LastSeenAtUtc) + "\n\n"
                + "ملاحظات:\n" + (string.IsNullOrWhiteSpace(record.Notes) ? "—" : record.Notes);
            MessageBox.Show(message, "تفاصيل الكود", MessageBoxButtons.OK, MessageBoxIcon.Information,
                MessageBoxDefaultButton.Button1, MessageBoxOptions.RtlReading | MessageBoxOptions.RightAlign);
        }

        private void DeleteSelected()
        {
            var record = SelectedRecord;
            if (record == null) return;
            if (MessageBox.Show(
                    "حذف الكود " + record.Code + " نهائيًا من قاعدة البيانات؟",
                    "تأكيد الحذف",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning,
                    MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
            _records.Remove(record);
            SaveAndRefresh();
            SetStatus("تم حذف الكود " + record.Code + ".");
        }

        private void CheckCode()
        {
            var code = LicenseLogic.NormalizeCode(_checkBox.Text);
            if (string.IsNullOrWhiteSpace(code))
            {
                SetCheckResult("أدخل كودًا أولًا.", Theme.Muted);
                return;
            }
            var record = _records.FirstOrDefault(r => string.Equals(r.Code, code, StringComparison.OrdinalIgnoreCase));
            if (record == null)
            {
                SetCheckResult("الكود غير موجود في قاعدة البيانات المحلية.", Theme.Red);
                SetStatus("فحص كود: غير موجود.");
                return;
            }
            var state = LicenseLogic.GetState(record);
            var color = LicenseLogic.GetStateColor(record);
            var text = "الحالة: " + LicenseLogic.GetStateLabel(record);
            if (record.ExpiresAtUtc.HasValue)
                text += " · ينتهي: " + LicenseLogic.FormatDate(record.ExpiresAtUtc);
            else if (state == LicenseState.Active)
                text += " · مدى الحياة";
            var user = LicenseLogic.GetUserLabel(record);
            if (!string.IsNullOrWhiteSpace(user)) text += "\nالمستخدم: " + user;
            if (!string.IsNullOrWhiteSpace(record.DeviceId)) text += "\nالجهاز: " + record.DeviceId;
            if (state == LicenseState.Valid) text += "\nصالح للتفعيل فورًا.";
            else if (state == LicenseState.Active && record.ExpiresAtUtc.HasValue)
            {
                var days = Math.Max(0, (int)Math.Ceiling((record.ExpiresAtUtc.Value - DateTime.UtcNow).TotalDays));
                text += "\nمتبقي: " + days + " يومًا.";
            }
            else if (state == LicenseState.Expired) text += "\nانتهت صلاحيته.";
            else if (state == LicenseState.Revoked) text += "\nالكود ملغى.";
            SetCheckResult(text, color);
            SetStatus("فحص كود: " + LicenseLogic.GetStateLabel(record) + " — " + record.Code);
        }

        private void SetCheckResult(string text, Color color)
        {
            if (_checkResult == null) return;
            _checkResult.Text = text;
            _checkResult.ForeColor = color;
        }

        private void SaveAndRefresh()
        {
            try
            {
                _store.Save();
            }
            catch (Exception exception)
            {
                MessageBox.Show("تعذر حفظ قاعدة البيانات:\n" + exception.Message, "Lin Go Gold Control",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            RefreshAll();
        }

        private void ExportCsv()
        {
            using (var dialog = new SaveFileDialog())
            {
                dialog.Title = "تصدير الأكواد إلى CSV";
                dialog.Filter = "CSV files (*.csv)|*.csv";
                dialog.FileName = "lin-go-licenses-" + DateTime.Now.ToString("yyyyMMdd-HHmm", CultureInfo.InvariantCulture) + ".csv";
                dialog.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                try
                {
                    _store.ExportCsv(dialog.FileName);
                    SetStatus("تم تصدير CSV: " + dialog.FileName);
                    MessageBox.Show("تم تصدير الملف بنجاح:\n" + dialog.FileName, "تصدير CSV",
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception exception)
                {
                    MessageBox.Show("تعذر التصدير:\n" + exception.Message, "تصدير CSV",
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void BackupJson()
        {
            using (var dialog = new SaveFileDialog())
            {
                dialog.Title = "نسخة احتياطية من قاعدة الأكواد";
                dialog.Filter = "JSON files (*.json)|*.json";
                dialog.FileName = "lin-go-licenses-backup-" + DateTime.Now.ToString("yyyyMMdd-HHmm", CultureInfo.InvariantCulture) + ".json";
                dialog.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                try
                {
                    _store.ExportJson(dialog.FileName);
                    SetStatus("تم حفظ نسخة احتياطية: " + dialog.FileName);
                    MessageBox.Show("تم حفظ النسخة الاحتياطية:\n" + dialog.FileName, "نسخة احتياطية",
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception exception)
                {
                    MessageBox.Show("تعذر حفظ النسخة الاحتياطية:\n" + exception.Message, "نسخة احتياطية",
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void ImportJson()
        {
            using (var dialog = new OpenFileDialog())
            {
                dialog.Title = "استيراد أكواد من نسخة احتياطية";
                dialog.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*";
                dialog.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                if (MessageBox.Show(
                        "سيتم دمج الأكواد الجديدة من الملف مع القاعدة الحالية.\nالأكواد المكررة لن تُضاف. هل تريد المتابعة؟",
                        "استيراد أكواد",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question,
                        MessageBoxDefaultButton.Button2) != DialogResult.Yes) return;
                try
                {
                    var added = _store.MergeJson(dialog.FileName);
                    RefreshAll();
                    SetStatus("تم استيراد " + added + " كودًا جديدًا.");
                    MessageBox.Show("تم الاستيراد. أُضيف " + added + " كودًا جديدًا.", "استيراد أكواد",
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception exception)
                {
                    MessageBox.Show("تعذر الاستيراد:\n" + exception.Message, "استيراد أكواد",
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        private void OpenDataFolder()
        {
            try
            {
                Directory.CreateDirectory(_store.DataDirectory);
                System.Diagnostics.Process.Start("explorer.exe", _store.DataDirectory);
            }
            catch (Exception exception)
            {
                MessageBox.Show("تعذر فتح المجلد:\n" + exception.Message, "بيانات التحكم",
                    MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void SetStatus(string message)
        {
            if (_statusBarLabel != null) _statusBarLabel.Text = message;
        }
    }

    internal sealed class GenerateDialog : Form
    {
        public int CodeCount { get; private set; }
        public int DurationDays { get; private set; }
        public int DeviceLimit { get; private set; }
        public string Notes { get; private set; }
        private NumericUpDown _count;
        private ComboBox _duration;
        private NumericUpDown _devices;
        private TextBox _notes;

        public GenerateDialog()
        {
            Text = "إنشاء أكواد Gold";
            Size = new Size(540, 500);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = Theme.Base;
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(22),
                ColumnCount = 1,
                RowCount = 10,
                BackColor = Theme.Background
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 42));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 26));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            Controls.Add(layout);

            var title = Ui.Label("إنشاء دفعة أكواد Gold", Theme.Title, Color.White, false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            layout.Controls.Add(FieldLabel("عدد الأكواد"), 0, 1);
            _count = new NumericUpDown
            {
                Minimum = 1,
                Maximum = 500,
                Value = 1,
                BackColor = Theme.Input,
                ForeColor = Theme.Text,
                BorderStyle = BorderStyle.FixedSingle,
                Font = Theme.Base,
                Dock = DockStyle.Fill,
                TextAlign = HorizontalAlignment.Center
            };
            layout.Controls.Add(_count, 0, 2);

            layout.Controls.Add(FieldLabel("مدة الترخيص بعد التفعيل"), 0, 3);
            _duration = Ui.ComboBox();
            _duration.Dock = DockStyle.Fill;
            _duration.Items.AddRange(new object[] { "30 يومًا", "90 يومًا", "180 يومًا", "365 يومًا", "مدى الحياة" });
            _duration.SelectedIndex = 0;
            layout.Controls.Add(_duration, 0, 4);

            layout.Controls.Add(FieldLabel("حد الأجهزة لكل كود"), 0, 5);
            _devices = new NumericUpDown
            {
                Minimum = 1,
                Maximum = 5,
                Value = 1,
                BackColor = Theme.Input,
                ForeColor = Theme.Text,
                BorderStyle = BorderStyle.FixedSingle,
                Font = Theme.Base,
                Dock = DockStyle.Fill,
                TextAlign = HorizontalAlignment.Center
            };
            layout.Controls.Add(_devices, 0, 6);

            layout.Controls.Add(FieldLabel("ملاحظات (اختياري)"), 0, 7);
            _notes = Ui.TextBox();
            _notes.Multiline = true;
            _notes.Dock = DockStyle.Fill;
            _notes.ScrollBars = ScrollBars.Vertical;
            layout.Controls.Add(_notes, 0, 8);

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                Padding = new Padding(0, 8, 0, 0),
                BackColor = Theme.Background
            };
            var cancel = Ui.OutlineButton("إلغاء", 100, 34);
            cancel.Click += delegate { DialogResult = DialogResult.Cancel; Close(); };
            var create = Ui.Button("إنشاء الأكواد", Theme.Gold, Color.FromArgb(20, 30, 43), 140, 34);
            create.Click += delegate { Confirm(); };
            actions.Controls.Add(cancel);
            actions.Controls.Add(create);
            layout.Controls.Add(actions, 0, 9);

            AcceptButton = create;
            CancelButton = cancel;
        }

        private static Label FieldLabel(string text)
        {
            var label = Ui.Label(text, Theme.Small, Theme.Muted, false);
            label.Dock = DockStyle.Fill;
            label.TextAlign = ContentAlignment.BottomLeft;
            return label;
        }

        private void Confirm()
        {
            CodeCount = (int)_count.Value;
            switch (_duration.SelectedIndex)
            {
                case 1: DurationDays = 90; break;
                case 2: DurationDays = 180; break;
                case 3: DurationDays = 365; break;
                case 4: DurationDays = 0; break;
                default: DurationDays = 30; break;
            }
            DeviceLimit = (int)_devices.Value;
            Notes = _notes.Text.Trim();
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    internal sealed class ActivateDialog : Form
    {
        public string UserName { get; private set; }
        public string UserEmail { get; private set; }
        public string DeviceId { get; private set; }
        public string Notes { get; private set; }
        private TextBox _name;
        private TextBox _email;
        private TextBox _device;
        private TextBox _notes;

        public ActivateDialog(LicenseRecord record)
        {
            Text = "تفعيل الكود";
            Size = new Size(520, 460);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = Theme.Base;
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(22),
                ColumnCount = 1,
                RowCount = 10,
                BackColor = Theme.Background
            };
            for (var i = 0; i < 8; i++) layout.RowStyles.Add(new RowStyle(SizeType.Absolute, i % 2 == 0 ? 26 : 36));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            Controls.Add(layout);

            var title = Ui.Label("تعيين الكود لمستخدم", Theme.Title, Color.White, false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            layout.Controls.Add(FieldLabel("اسم المستخدم"), 0, 1);
            _name = Ui.TextBox();
            _name.Dock = DockStyle.Fill;
            _name.Text = record.UserName ?? string.Empty;
            layout.Controls.Add(_name, 0, 2);

            layout.Controls.Add(FieldLabel("البريد الإلكتروني"), 0, 3);
            _email = Ui.TextBox();
            _email.Dock = DockStyle.Fill;
            _email.Text = record.UserEmail ?? string.Empty;
            layout.Controls.Add(_email, 0, 4);

            layout.Controls.Add(FieldLabel("معرّف الجهاز (اختياري)"), 0, 5);
            _device = Ui.TextBox(true);
            _device.Dock = DockStyle.Fill;
            _device.Text = record.DeviceId ?? string.Empty;
            layout.Controls.Add(_device, 0, 6);

            layout.Controls.Add(FieldLabel("ملاحظات"), 0, 7);
            _notes = Ui.TextBox();
            _notes.Multiline = true;
            _notes.Dock = DockStyle.Fill;
            _notes.ScrollBars = ScrollBars.Vertical;
            _notes.Text = record.Notes ?? string.Empty;
            layout.Controls.Add(_notes, 0, 8);

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                Padding = new Padding(0, 8, 0, 0),
                BackColor = Theme.Background
            };
            var cancel = Ui.OutlineButton("إلغاء", 100, 34);
            cancel.Click += delegate { DialogResult = DialogResult.Cancel; Close(); };
            var save = Ui.Button("حفظ التفعيل", Theme.GreenSoft, Color.FromArgb(8, 30, 18), 132, 34);
            save.Click += delegate { Confirm(); };
            actions.Controls.Add(cancel);
            actions.Controls.Add(save);
            layout.Controls.Add(actions, 0, 9);
            AcceptButton = save;
            CancelButton = cancel;
        }

        private static Label FieldLabel(string text)
        {
            var label = Ui.Label(text, Theme.Small, Theme.Muted, false);
            label.Dock = DockStyle.Fill;
            label.TextAlign = ContentAlignment.BottomLeft;
            return label;
        }

        private void Confirm()
        {
            if (string.IsNullOrWhiteSpace(_name.Text) && string.IsNullOrWhiteSpace(_email.Text))
            {
                MessageBox.Show("أدخل اسم المستخدم أو بريده الإلكتروني على الأقل.", "تفعيل الكود",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            UserName = _name.Text.Trim();
            UserEmail = _email.Text.Trim();
            DeviceId = _device.Text.Trim();
            Notes = _notes.Text.Trim();
            DialogResult = DialogResult.OK;
            Close();
        }
    }

    internal sealed class NotesDialog : Form
    {
        public string Notes { get; private set; }
        private TextBox _notes;

        public NotesDialog(LicenseRecord record)
        {
            Text = "ملاحظات الكود";
            Size = new Size(520, 300);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = Theme.Base;
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(22),
                ColumnCount = 1,
                RowCount = 3,
                BackColor = Theme.Background
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 34));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            Controls.Add(layout);

            var title = Ui.Label(record.Code, Theme.Section, Theme.Gold, false);
            title.Dock = DockStyle.Fill;
            title.Font = Theme.Code;
            layout.Controls.Add(title, 0, 0);

            _notes = Ui.TextBox();
            _notes.Multiline = true;
            _notes.Dock = DockStyle.Fill;
            _notes.ScrollBars = ScrollBars.Vertical;
            _notes.Text = record.Notes ?? string.Empty;
            layout.Controls.Add(_notes, 0, 1);

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.RightToLeft,
                WrapContents = false,
                Padding = new Padding(0, 8, 0, 0),
                BackColor = Theme.Background
            };
            var cancel = Ui.OutlineButton("إلغاء", 100, 34);
            cancel.Click += delegate { DialogResult = DialogResult.Cancel; Close(); };
            var save = Ui.Button("حفظ", Theme.Gold, Color.FromArgb(20, 30, 43), 100, 34);
            save.Click += delegate
            {
                Notes = _notes.Text.Trim();
                DialogResult = DialogResult.OK;
                Close();
            };
            actions.Controls.Add(cancel);
            actions.Controls.Add(save);
            layout.Controls.Add(actions, 0, 2);
            AcceptButton = save;
            CancelButton = cancel;
        }
    }

    internal sealed class GeneratedCodesDialog : Form
    {
        private readonly List<LicenseRecord> _codes;

        public GeneratedCodesDialog(List<LicenseRecord> codes)
        {
            _codes = codes;
            Text = "الأكواد الجديدة";
            Size = new Size(700, 540);
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.Sizable;
            MinimumSize = new Size(560, 420);
            BackColor = Theme.Background;
            ForeColor = Theme.Text;
            Font = Theme.Base;
            RightToLeft = RightToLeft.Yes;
            RightToLeftLayout = true;

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                Padding = new Padding(22),
                ColumnCount = 1,
                RowCount = 4,
                BackColor = Theme.Background
            };
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 44));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 28));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100f));
            layout.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            Controls.Add(layout);

            var title = Ui.Label(
                codes.Count == 1 ? "تم إنشاء كود واحد" : "تم إنشاء " + codes.Count + " كودًا",
                Theme.Title,
                Color.White,
                false);
            title.Dock = DockStyle.Fill;
            title.TextAlign = ContentAlignment.MiddleLeft;
            layout.Controls.Add(title, 0, 0);

            var hint = Ui.Label("انسخها الآن أو احفظها كملف CSV. الأكواد محفوظة في قاعدة البيانات المحلية.", Theme.Small, Theme.Muted, false);
            hint.Dock = DockStyle.Fill;
            layout.Controls.Add(hint, 0, 1);

            var text = new TextBox
            {
                Dock = DockStyle.Fill,
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Both,
                BackColor = Theme.Input,
                ForeColor = Theme.Gold,
                Font = new Font("Consolas", 11f, FontStyle.Bold, GraphicsUnit.Point),
                Text = string.Join(Environment.NewLine, _codes.Select(c => c.Code).ToArray()),
                WordWrap = false,
                RightToLeft = RightToLeft.No
            };
            layout.Controls.Add(text, 0, 2);

            var actions = new FlowLayoutPanel
            {
                Dock = DockStyle.Fill,
                FlowDirection = FlowDirection.LeftToRight,
                WrapContents = false,
                Padding = new Padding(0, 8, 0, 0),
                BackColor = Theme.Background
            };
            var close = Ui.OutlineButton("إغلاق", 100, 34);
            close.Click += delegate { Close(); };
            var save = Ui.Button("حفظ CSV", Theme.Gold, Color.FromArgb(20, 30, 43), 112, 34);
            save.Click += delegate { SaveCsv(); };
            var copy = Ui.Button("نسخ الكل", Theme.CardAlt, Theme.Text, 112, 34);
            copy.Click += delegate
            {
                Clipboard.SetText(text.Text);
                MessageBox.Show("تم نسخ جميع الأكواد.", "الأكواد الجديدة", MessageBoxButtons.OK, MessageBoxIcon.Information);
            };
            actions.Controls.Add(close);
            actions.Controls.Add(save);
            actions.Controls.Add(copy);
            layout.Controls.Add(actions, 0, 3);
            CancelButton = close;
        }

        private void SaveCsv()
        {
            using (var dialog = new SaveFileDialog())
            {
                dialog.Title = "حفظ الأكواد";
                dialog.Filter = "CSV files (*.csv)|*.csv";
                dialog.FileName = "lin-go-new-codes-" + DateTime.Now.ToString("yyyyMMdd-HHmm", CultureInfo.InvariantCulture) + ".csv";
                dialog.InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                if (dialog.ShowDialog(this) != DialogResult.OK) return;
                try
                {
                    var builder = new StringBuilder();
                    builder.AppendLine("الكود,المدة,حد الأجهزة,ملاحظات");
                    foreach (var code in _codes)
                    {
                        builder.AppendLine(string.Join(",", new[]
                        {
                            code.Code,
                            LicenseLogic.FormatDuration(code.DurationDays),
                            code.DeviceLimit.ToString(CultureInfo.InvariantCulture),
                            (code.Notes ?? string.Empty).Replace(",", "،").Replace("\r", " ").Replace("\n", " ")
                        }));
                    }
                    File.WriteAllText(dialog.FileName, builder.ToString(), new UTF8Encoding(true));
                    MessageBox.Show("تم حفظ الملف:\n" + dialog.FileName, "حفظ الأكواد",
                        MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception exception)
                {
                    MessageBox.Show("تعذر الحفظ:\n" + exception.Message, "حفظ الأكواد",
                        MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }
    }
}
