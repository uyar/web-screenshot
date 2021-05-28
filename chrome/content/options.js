//Fails on FF 3.6
//Components.utils.import("resource://gre/modules/Services.jsm");

var gScreenshoterOptions = {
	pref: Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.web-screenshot."),

	getPref: function(name, type, def_value) {
		var v = def_value;
		try {
			switch (type) {
				case "bool" :
					v = gScreenshoterOptions.pref.getBoolPref(name);
					break;
				case "int" :
					v = gScreenshoterOptions.pref.getIntPref(name);
					break;
				case "text" :
					v = gScreenshoterOptions.pref.getCharPref(name);
					break;
			}
		} catch (e) {
		}
		return v;
	},

	setPref: function(name, type, value) {
		try {
			switch (type) {
				case "bool":
					gScreenshoterOptions.pref.setBoolPref(name, value);
					break;
				case "int":
					gScreenshoterOptions.pref.setIntPref(name,  value);
					break;
				case "text":
					gScreenshoterOptions.pref.setCharPref(name, value);
					break;
			}
		} catch (e) {
		}
	},

	setCheck: function(name, defaultValue) {
		document.getElementById(name).checked = gScreenshoterOptions.getPref(name, "bool", defaultValue);
	},

	setRadio: function(name, defaultValue) {
		var value = gScreenshoterOptions.getPref(name, "text", defaultValue);
		var rg = document.getElementById(name);
		var rl = rg.getElementsByTagName('radio');
		for (var i=0; i<rl.length; i++) {
			var r = rl[i];
			if (r.value == value) {
				rg.selectedIndex = i;
				break;
			}
		}
	},

	setText: function(name, type, defaultValue) {
		var value = gScreenshoterOptions.getPref(name, type, defaultValue);
		document.getElementById(name).value = value;
	},

	onLoad: function() {
		gScreenshoterOptions.updateJPGImageQuality(gScreenshoterOptions.pref.getIntPref("JPGImageQuality"));

		var savePath = gScreenshoterOptions.pref.getComplexValue("defaultFolder", Components.interfaces.nsISupportsString, str);
		document.getElementById("defaultFolder").value = savePath;
	},

	updateCheckPref: function(name) {
		var v = document.getElementById(name).checked;
		gScreenshoterOptions.setPref(name, "bool", v);
	},

	updateRadioPref: function(name) {
		var rg = document.getElementById(name);
		gScreenshoterOptions.setPref(name, "text", rg.selectedItem.value);
	},

	updateTextPref: function(name, type) {
		var v = document.getElementById(name).value;
		gScreenshoterOptions.setPref(name, type, v);
	},

	doOk: function() {
		if (!gScreenshoterOptions.checkSaveFolder())
			return false;

		gScreenshoterOptions.updateRadioPref("defaultAction");
		gScreenshoterOptions.updateRadioPref("defaultTarget");
		gScreenshoterOptions.updateRadioPref("defaultType");
		gScreenshoterOptions.updateTextPref("JPGImageQuality", "int");
		Screenshoter.setSaveFolder(document.getElementById("defaultFolder").value);
		gScreenshoterOptions.updateRadioPref("filenameTemplate");
		gScreenshoterOptions.updateCheckPref("showInDLManager");
		gScreenshoterOptions.updateCheckPref("showInContextMenu");
		gScreenshoterOptions.updateRadioPref("notificationType");

		return true;
	},

	setDefaultsRadio: function(name, value) {
		var rg = document.getElementById(name);
		var rl = rg.getElementsByTagName('radio');
		for (var i=0; i<rl.length; i++) {
			var r = rl[i];
			if (r.value == value) {
				rg.selectedIndex = i;
				break;
			}
		}
	},

	resetDefaults: function() {
		var prefDef = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getDefaultBranch("extensions.web-screenshot.");

		gScreenshoterOptions.setDefaultsRadio("defaultAction", prefDef.getCharPref("defaultAction"));
		gScreenshoterOptions.setDefaultsRadio("defaultTarget", prefDef.getCharPref("defaultTarget"));
		gScreenshoterOptions.setDefaultsRadio("defaultType", prefDef.getCharPref("defaultType"));
		gScreenshoterOptions.updateJPGImageQuality(prefDef.getIntPref("JPGImageQuality"));

		var desktopPath = prefDef.getComplexValue("defaultFolder",
					Components.interfaces.nsISupportsString).data;
		document.getElementById("defaultFolder").value = desktopPath;
		// if empty set path to desktop
		if (!desktopPath) {
			desktopPath = Screenshoter.getDefaultFolder();
			document.getElementById("defaultFolder").value = desktopPath.path;
		}

		document.getElementById("showInDLManager").checked = prefDef.getBoolPref("showInDLManager");
		document.getElementById("showInContextMenu").checked = prefDef.getBoolPref("showInContextMenu");

		gScreenshoterOptions.setDefaultsRadio("notificationType", prefDef.getCharPref("notificationType"));

		gScreenshoterOptions.setDefaultsRadio("filenameTemplate", prefDef.getCharPref("filenameTemplate"));

		return gScreenshoterOptions.doOk();
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
	},

	myDump: function(aMessage) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
				.getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("["+ aMessage +"]");
	}
};
