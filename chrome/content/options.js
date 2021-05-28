var gScreenshoterOptions = {
    pref: Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService)
                    .getBranch("extensions.web-screenshot."),

    updateJPGImageQuality: function(value) {
        document.getElementById('JPGImageQuality').value = value;
        document.getElementById('JPGImageQuality_label').value = value + '%';
    },

    changeSaveFolder: function() {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"]
                           .createInstance(nsIFilePicker);
        fp.init(window, "Select directory to store screenshots", nsIFilePicker.modeGetFolder);
        var res = fp.show();
        if (res == nsIFilePicker.returnOK) {
            var element = document.getElementById("defaultFolder");
            element.value = fp.file.path;
        }

        var str = Components.classes["@mozilla.org/supports-string;1"]
                            .createInstance(Components.interfaces.nsISupportsString);
        str.data = fp.file.path;
        gScreenshoterOptions.pref.setComplexValue("defaultFolder", Components.interfaces.nsISupportsString, str);
    },

    onLoad: function() {
        gScreenshoterOptions.updateJPGImageQuality(gScreenshoterOptions.pref.getIntPref("JPGImageQuality"));

        var savePath = gScreenshoterOptions.pref.getComplexValue("defaultFolder", Components.interfaces.nsISupportsString);
        document.getElementById("defaultFolder").value = savePath;
    }
};
