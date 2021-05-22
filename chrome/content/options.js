//Fails on FF 3.6
//Components.utils.import("resource://gre/modules/Services.jsm");

var gScreenshoterOptions = {
	pref: Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.Screenshoter."),
	
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
				case "bool" :
					gScreenshoterOptions.pref.setBoolPref(name, value);
					break;
				case "int" :
					gScreenshoterOptions.pref.setIntPref(name,  value);
					break;
				case "text" :
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
	
	setHotkey: function(name, defaultKey, force) {
		var key  = gScreenshoterOptions.getPref(name, 'text', '');
		if ((typeof force !== "undefined") && force) {
			key = defaultKey;
		}
		
		var text = '';
		if (key) {
			key = JSON.parse(key);
			text = gScreenshoterOptions.hotkey_key2string(key);
		}
		
		name = name.replace('hotkey_save_', 'Screenshoter_save_');
		document.getElementById(name).value = text;
		document.getElementById(name).hotkey_hash = key;
	},
	
	onLoad: function() {
		gScreenshoterOptions.setRadio("default_action",          "save");
		gScreenshoterOptions.setRadio("default_target",          "getComplete");
		gScreenshoterOptions.setRadio("default_type",            "image/png");
		document.getElementById("default_folder").value =        Screenshoter.getSaveFolder().path;
		gScreenshoterOptions.setCheck("use_downloadmanager",     true);
		gScreenshoterOptions.setText("JPGImageQuality",          "int", 80);
		gScreenshoterOptions.setText("JPGImageQuality_label",    "text",
				gScreenshoterOptions.getPref("JPGImageQuality",  "int", 80) +"%");
		gScreenshoterOptions.setRadio("notification",            "popup");
		gScreenshoterOptions.setCheck("use_incontextmenu",       true);
		gScreenshoterOptions.setRadio("filetemplate",            "domain");
		
		gScreenshoterOptions.setHotkey("hotkey_save_complete" );  //'{"modifiers":["accel"],"key":"M","keycode":""}',       '');
		gScreenshoterOptions.setHotkey("hotkey_save_visible"  );  //'{"modifiers":["accel","alt"],"key":"M","keycode":""}', '');
		gScreenshoterOptions.setHotkey("hotkey_save_selection");  //'', '');
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
	
	updateHotkeyPref: function(name) {
		var key = document.getElementById(name.replace('hotkey_save_', 'Screenshoter_save_')).hotkey_hash;
		gScreenshoterOptions.setPref(name, "text", (key ? JSON.stringify(key) : ''));
	},
	
	
	doOk: function() {
		if (!gScreenshoterOptions.checkSaveFolder())
			return false;
		
		gScreenshoterOptions.updateRadioPref("default_action");
		gScreenshoterOptions.updateRadioPref("default_target");
		gScreenshoterOptions.updateRadioPref("default_type");
		Screenshoter.setSaveFolder(document.getElementById("default_folder").value);
		gScreenshoterOptions.updateCheckPref("use_downloadmanager");
		gScreenshoterOptions.updateTextPref("JPGImageQuality", "int");
		gScreenshoterOptions.updateRadioPref("notification");
		gScreenshoterOptions.updateCheckPref("use_incontextmenu");
		gScreenshoterOptions.updateRadioPref("filetemplate");
		
		gScreenshoterOptions.updateHotkeyPref("hotkey_save_complete");
		gScreenshoterOptions.updateHotkeyPref("hotkey_save_visible");
		gScreenshoterOptions.updateHotkeyPref("hotkey_save_selection");
		
		//activate hotkeys
		gScreenshoterOptions.refreshHotkeys();
		
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
	ResetDefaults: function() {
		var prefDef = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getDefaultBranch("extensions.Screenshoter.");
		
		gScreenshoterOptions.setDefaultsRadio("default_action", prefDef.getCharPref("default_action"));
		gScreenshoterOptions.setDefaultsRadio("default_target", prefDef.getCharPref("default_target"));
		gScreenshoterOptions.setDefaultsRadio("default_type",   prefDef.getCharPref("default_type"));
		
		document.getElementById("use_downloadmanager").checked  = prefDef.getBoolPref("use_downloadmanager");
		document.getElementById("use_incontextmenu").checked    = prefDef.getBoolPref("use_incontextmenu");
		
		gScreenshoterOptions.updateJPGImageQuality(prefDef.getIntPref("JPGImageQuality"));
		gScreenshoterOptions.setDefaultsRadio("notification",   prefDef.getCharPref("notification"));
		
		gScreenshoterOptions.setDefaultsRadio("filetemplate",   prefDef.getCharPref("filetemplate"));
		
		
		var desktopPath = prefDef.getComplexValue("default_folder",
					Components.interfaces.nsISupportsString).data;
		document.getElementById("default_folder").value = desktopPath;
		// if empty set path to desktop
		if (!desktopPath) {
			desktopPath = Screenshoter.getDefaultFolder();
			document.getElementById("default_folder").value = desktopPath.path;
		}
		
		gScreenshoterOptions.setHotkey("hotkey_save_complete",  prefDef.getCharPref("hotkey_save_complete"),  true);
		gScreenshoterOptions.setHotkey("hotkey_save_visible",   prefDef.getCharPref("hotkey_save_visible"),   true);
		gScreenshoterOptions.setHotkey("hotkey_save_selection", prefDef.getCharPref("hotkey_save_selection"), true);
		
		return true;
	},
	
	
	changeSaveFolder: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"]
					.createInstance(nsIFilePicker);
		fp.init(window, "Select Directory to Store Screen Shots", nsIFilePicker.modeGetFolder);
		var res = null;
		res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var element = document.getElementById("default_folder");
			element.value = fp.file.path;
		}
	},
	
	checkSaveFolder: function() {
		var stDir = document.getElementById("default_folder").value;
		
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
			var r = confirm(stDir + " does not exis.\r\nDo you want to create now?");
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
	
	
	
	handle_Hotkey: function(event, box) {
		var keyres = gScreenshoterOptions.validateInputKey(event, box);
		if (keyres === 'SKIPTAB') {
			return;
		}
		
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
		//this.myDump(box.id + '-'+ event.charCode);
		
		if (keyres === 'SKIP') {
			return;
		}
		
		var warn = document.getElementById('screenshoter_dublicate_hotkey');
		warn.hidden = true;
		if ( keyres ) {
			var tag = warn.getAttribute('data-tag2');
			warn.value = tag.replace('()', '('+ keyres +')');
			warn.hidden = false;
		}
	},
	
	
	
	
//// Ideas from screengrab extension ;)
//// With some mods and improvements..
	validateInputKey: function(event, box) {
		//event.preventDefault();
		//event.stopPropagation();
		//event.stopImmediatePropagation();
		
		var key       = { modifiers: [], key: '', keycode: '' };
		var modifiers = [ 'ctrl', 'alt', 'shift' ];
		for (var i in modifiers) {
			var k = modifiers[i];
			if (event[k + 'Key']) {
				if (k == 'ctrl') {
					k = 'control';
				}
				key.modifiers.push(k);
			}
		}
		
		if (key.modifiers.length == 0) {
			//Allow TAB key
			if (event.keyCode == 9) {
				box.select();
				return 'SKIPTAB';
			}
			
			//delete = empty hotkey
			if ((event.keyCode == 8) || (event.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_DELETE)) {
				box.value       = '';
				box.hotkey_hash = ''; //default empty value
			}
			box.select();
			return 'SKIP';
		}
		if (key.modifiers.length == 1) {
			//Allow SHIFT+TAB key
			if ((key.modifiers[0] == 'shift') && (event.keyCode == 9)) {
				box.select();
				return 'SKIPTAB';
			}
			if (key.modifiers[0] == 'shift') {
				box.select();
				return 'SKIP';
			}
		}
		
		if (event.charCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_SPACE) {
			key.keycode = "VK_SPACE";
		} else if (event.keyCode == 8) {
			key.keycode = "VK_BACK";
		} else if (event.charCode) {
			key.key = String.fromCharCode(event.charCode).toUpperCase();
		} else {
			for (let [keycode, val] in Iterator(Components.interfaces.nsIDOMKeyEvent)) {
				if (val == event.keyCode) {
					key.keycode = keycode.replace("DOM_","");
					break;
				}
			}
		}
		if ((key.key == '') && (key.keycode == '')) {
			box.select();
			return 'SKIP';
		}
		
		box.value = gScreenshoterOptions.hotkey_key2string(key);
		var res_check = gScreenshoterOptions.hotkey_check_hotkey(key, box.id+'_key');
		box.select();
		box.hotkey_hash = key;
		return res_check;
	},
	hotkey_get_accel_key: function() {
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).QueryInterface(Components.interfaces.nsIPrefBranch);
		switch (prefs.getIntPref("ui.key.accelKey")) {
			case 17:  return "control"; break;
			case 18:  return "alt"; break;
			case 224: return "meta"; break;
		}
		return "control";
	},
	hotkey_check_hotkey: function(key, skip_id) {
		if (!key)
			return;
		
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var win = wm.getMostRecentWindow("navigator:browser");

		var keys = win.document.getElementsByTagName("key");
		var accel_key = gScreenshoterOptions.hotkey_get_accel_key();
		var result = '';

		//-----------------------------------------------------------------------------------
		for (var i=0; i<keys.length; i++) {
			var k = keys[i];
			var key_id = k.id || k.getAttribute('id') || 'unknown';
			if (key_id == skip_id) {
				continue;
			}

			//---------------------------------------------------------------------------
			try {
				var key_ary = k.getAttribute("modifiers").split(/\W+/);
				var key_length = key.modifiers.length;
				for (var k1 in key_ary) {
					var km = key_ary[k1];
					for (var k2 in key.modifiers) {
						var km2 = key.modifiers[k2];
						if (km == 'accel') {
							km = accel_key;
						}
						if (km.toUpperCase() == km2.toUpperCase()) {
							key_length--;
						}
					}
				}
				if ((key_length == 0) && (key.modifiers.length == key_ary.length)) {
					var key_value = k.key || k.getAttribute('key') || '';
					var keycode_value = k.keycode || k.getAttribute('keycode') || '';
					if ((key_value.toUpperCase() == key.key.toUpperCase()) && (keycode_value.toUpperCase() == key.keycode.toUpperCase())) {
						result = key_id;
					}
				}
			}
			catch (e) {
			}
		}
		
		return result;
	},
	hotkey_key2string: function(key) {
		if (!key)
			return '';
		
		var stringBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]
                                    .getService(Components.interfaces.nsIStringBundleService);
		var result = [];
		//var platformKeys_string = Services.strings.createBundle("chrome://global-platform/locale/platformKeys.properties");
		var platformKeys_string = stringBundleService.createBundle("chrome://global-platform/locale/platformKeys.properties");
		
		for (var i in key.modifiers) {
			var k = key.modifiers[i];
			if (k == 'accel') {
				k = gScreenshoterOptions.hotkey_get_accel_key();
			}
			result.push(platformKeys_string.GetStringFromName("VK_" + k.toUpperCase()));
		}

		if (key.key == " ") {
			key.key = "";
			key.keycode = "VK_SPACE";
		}
		if (key.key) {
			result.push(key.key.toUpperCase());
		}
		else if (key.keycode) {
			try {
				//var keys_string = Services.strings.createBundle("chrome://global/locale/keys.properties");
				var platformKeys_string = stringBundleService.createBundle("chrome://global/locale/keys.properties");
				result.push(keys_string.GetStringFromName(key.keycode));
			} catch (e) {
				result.push('<' + key.keycode + '>');
			}
		}
		var separator = platformKeys_string.GetStringFromName("MODIFIER_SEPARATOR");
		return result.join(' ' + separator + ' ');
	},
	
	hotkey_apply: function(name, action) {
		var key = gScreenshoterOptions.getPref(name, 'text', '');
		if (!key)
			return '';
		key = JSON.parse(key);
		key.action = action;
		
		var key_id = name.replace('hotkey_save_', 'Screenshoter_save_') +'_key';
		
		try {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var e = wm.getEnumerator(null);
			var win;

			var modifiers = key.modifiers.join(' ').replace(gScreenshoterOptions.hotkey_get_accel_key(),"accel");

			while (e.hasMoreElements()) {
				win = e.getNext();
				var key_node = win.document.getElementById( key_id );

				var keyset_node = null;

				if ((! key_node) && (key.action)) {
					var hotkeys_keyset = win.document.getElementById('Screenshoter_keyset');
					var menu_item = win.document.getElementById(key.action);
					if (hotkeys_keyset && menu_item) {
						key_node = win.document.createElement('key');
						hotkeys_keyset.appendChild(key_node);
						key_node.id = key_id;
						menu_item.setAttribute("key", key_id);
						key_node.oncommand = menu_item.oncommand;
						key_node.setAttribute('oncommand', menu_item.getAttribute('oncommand'));
					}
				}
				if (key_node) {
					key_node.removeAttribute("keycode");
					key_node.removeAttribute("charcode");
					key_node.removeAttribute("keytext");
					key_node.removeAttribute("key");
					key_node.removeAttribute("modifiers");

					if (key.disabled) {
						key_node.setAttribute("modifiers", '');
						key_node.setAttribute("key", '');
						key_node.setAttribute("keycode", '');
					} else {
						key_node.setAttribute("modifiers", modifiers);
						if (key.key !== undefined) {
							key_node.setAttribute("key", key.key);
						}
						if (key.keycode !== undefined) {
							key_node.setAttribute("keycode", key.keycode);
						}
					}

					var keyset_node = key_node.parentNode;
					while (keyset_node.parentNode && keyset_node.parentNode.localName == "keyset") {
						keyset_node = keyset_node.parentNode;
					}
					keyset_node.parentNode.insertBefore(keyset_node, keyset_node.nextSibling);

					var menuitems = win.document.getElementsByAttribute("key", key_id);
					for (var m=0; m<menuitems.length; m++) {
						menuitems[m].setAttribute("acceltext","");
						menuitems[m].removeAttribute("acceltext");
					}
				}
			}
		}
		catch (e) {
		}
	},
	
	refreshHotkeys : function() {
		gScreenshoterOptions.hotkey_remove_all();
		
		//activate hotkeys
		gScreenshoterOptions.hotkey_apply("hotkey_save_complete",  'Screenshoter_save_complete_cmd');
		gScreenshoterOptions.hotkey_apply("hotkey_save_visible",   'Screenshoter_save_visible_cmd');
		gScreenshoterOptions.hotkey_apply("hotkey_save_selection", 'Screenshoter_save_selection_cmd');
	},
	hotkey_remove_all: function() {
		try {
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
			var e = wm.getEnumerator(null);
			var win;

			while (e.hasMoreElements()) {
				win = e.getNext();
				var hotkeys_keyset = win.document.getElementById('Screenshoter_keyset');
				if (hotkeys_keyset) {
					var keys = hotkeys_keyset.getElementsByTagName("key");
					for (var i=0; i<keys.length; i++) {
						var k = keys[i];
						var key_id = k.id || k.getAttribute('id') || 'unknown';
						var menuitems = win.document.getElementsByAttribute("key", key_id);
						for (var m=0; m<menuitems.length; m++) {
							menuitems[m].setAttribute("acceltext","");
							menuitems[m].removeAttribute("acceltext");
						}
					}
					while (hotkeys_keyset.firstChild) {
						hotkeys_keyset.removeChild(hotkeys_keyset.firstChild);
					}
					hotkeys_keyset.parentNode.insertBefore(hotkeys_keyset, hotkeys_keyset.nextSibling);
				}
			}
		} catch(e) {
		}
	},
////////////
	
	
	
	myDump: function(aMessage) {
		var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
				.getService(Components.interfaces.nsIConsoleService);
		consoleService.logStringMessage("["+ aMessage +"]");
	}
};
