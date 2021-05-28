//Fails on FF 3.6
//Components.utils.import("resource://gre/modules/Services.jsm");

var gScreenshoterOptions = {
	pref: Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.web-screenshot."),

	onLoad: function() {
		gScreenshoterOptions.updateJPGImageQuality(gScreenshoterOptions.pref.getIntPref("JPGImageQuality"));

		var savePath = gScreenshoterOptions.pref.getComplexValue("defaultFolder", Components.interfaces.nsISupportsString);
		document.getElementById("defaultFolder").value = savePath;
	},

	changeSaveFolder: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"]
					.createInstance(nsIFilePicker);
		fp.init(window, "Select directory to store screenshots", nsIFilePicker.modeGetFolder);
		var res = null;
		res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var element = document.getElementById("defaultFolder");
			element.value = fp.file.path;
		}
	},

	checkSaveFolder: function() {
		var stDir = document.getElementById("defaultFolder").value;

		var stDirFile = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);

		try {
			stDirFile.initWithPath(stDir);
		} catch (e) {
			alert("Failed to create folder " + stDir);
			return false;
		}

		if (stDirFile.exists()) {
			if (!stDirFile.isDirectory()) {
				alert(stDir + " is not a folder");
				return false;
			}
		}
		else {
			var r = confirm(stDir + " does not exist.\r\nDo you want to create now?");
			if (r == false)
				return false;
			try {
				stDirFile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0775", 8))
			} catch (e) {
				alert("Failed to create folder " + stDir);
				return false;
			}
		}
		return true;
	},

	updateJPGImageQuality: function(value) {
		document.getElementById('JPGImageQuality').value = value;
		document.getElementById('JPGImageQuality_label').value = value + '%';
	}
};
