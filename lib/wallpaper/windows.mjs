import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// IDesktopWallpaper (Windows 8+) is the only API that sets a different wallpaper per monitor.
// PowerShell can't call COM interfaces through a cast, so the calls live in C# and PowerShell
// only invokes the static methods.
const PRELUDE = `
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
trap { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace Wallangle {
	[StructLayout(LayoutKind.Sequential)]
	public struct Rect { public int Left, Top, Right, Bottom; }

	public enum Position { Center = 0, Tile = 1, Stretch = 2, Fit = 3, Fill = 4, Span = 5 }

	// Methods must be declared in vtable order; the ones after SetPosition are not needed.
	[ComImport, Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
	interface IDesktopWallpaper {
		void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorId, [MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
		[return: MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitorId);
		[return: MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint monitorIndex);
		uint GetMonitorDevicePathCount();
		Rect GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitorId);
		void SetBackgroundColor(uint color);
		uint GetBackgroundColor();
		void SetPosition(Position position);
	}

	[ComImport, Guid("C2CF3110-460E-4fc1-B9D0-8A1C0C9CC4BD")]
	class DesktopWallpaperClass {}

	public class Monitor {
		public string id { get; set; }
		public int width { get; set; }
		public int height { get; set; }
	}

	public static class Desktop {
		[DllImport("user32.dll")]
		static extern bool SetProcessDPIAware();

		static IDesktopWallpaper Open() {
			// Without this, monitor sizes are reported in DPI-scaled rather than physical pixels.
			SetProcessDPIAware();
			return (IDesktopWallpaper)new DesktopWallpaperClass();
		}

		public static Monitor[] ListMonitors() {
			var desktop = Open();
			var monitors = new List<Monitor>();
			for (uint i = 0; i < desktop.GetMonitorDevicePathCount(); i++) {
				var id = desktop.GetMonitorDevicePathAt(i);
				Rect rect;
				// Disconnected monitors are still listed but have no rectangle.
				try { rect = desktop.GetMonitorRECT(id); } catch (COMException) { continue; }
				var width = rect.Right - rect.Left;
				var height = rect.Bottom - rect.Top;
				if (width > 0 && height > 0) {
					monitors.Add(new Monitor { id = id, width = width, height = height });
				}
			}
			return monitors.ToArray();
		}

		public static void SetWallpapers(string[] ids, string[] paths) {
			var desktop = Open();
			desktop.SetPosition(Position.Fill);
			for (var i = 0; i < ids.Length; i++) {
				desktop.SetWallpaper(ids[i], paths[i]);
			}
		}
	}
}
'@
`;

const LIST_MONITORS = `
ConvertTo-Json -InputObject @([Wallangle.Desktop]::ListMonitors()) -Compress
`;

const SET_WALLPAPERS = `
[Wallangle.Desktop]::SetWallpapers($env:WALLANGLE_IDS -split '\\n', $env:WALLANGLE_PATHS -split '\\n')
`;

async function runPowerShell(script, env = {}) {
	const encoded = Buffer.from(PRELUDE + script, 'utf16le').toString('base64');
	try {
		const { stdout } = await execFileAsync(
			'powershell.exe',
			['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
			{ env: { ...process.env, ...env }, windowsHide: true }
		);
		return stdout;
	} catch (error) {
		throw new Error(`PowerShell failed: ${error.stderr?.trim() || error.message}`);
	}
}

/** @returns {Promise<{ id: string, width: number, height: number }[]>} */
export async function listMonitors() {
	return JSON.parse(await runPowerShell(LIST_MONITORS));
}

/** @param {{ id: string, path: string }[]} assignments */
export async function setWallpapers(assignments) {
	// Monitor IDs and paths never contain newlines, so they travel as newline-separated lists.
	await runPowerShell(SET_WALLPAPERS, {
		WALLANGLE_IDS: assignments.map(({ id }) => id).join('\n'),
		WALLANGLE_PATHS: assignments.map(({ path }) => path).join('\n'),
	});
}
