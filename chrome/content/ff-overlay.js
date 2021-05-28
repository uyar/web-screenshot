var ScreenshoterSelector = {
	BACKGROUND_DIV : "__ScreenshoterBgDiv",
	GRAB_DIV       : "__ScreenshoterDiv",
	SEL_DIV        : "__ScreenshoterSelectDiv",
	imgFile:       null,
	cancel:        false,

	originX : null,
	originY : null,
	mouseX  : null,
	mouseY  : null,
	offsetX : null,
	offsetY : null,

	isSelecting: function(){
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;
		return doc.getElementById(ScreenshoterSelector.GRAB_DIV) != null;
	},

	cancelBoxSelect: function(event) {
		if (event.keyCode == 27) {
			ScreenshoterSelector.cancel = true;

			//cleanup
			ScreenshoterSelector.endBoxSelect();
			ScreenshoterSelector.finishSelect();
		}
	},

	startSelect : function() {
		if (ScreenshoterSelector.isSelecting())
			return;

		ScreenshoterSelector.cancel = false;

		var win = Screenshoter.getWindowsContent();
		var doc = win.document;

		var body = doc.getElementsByTagName("html")[0];

		var ScreenshoterDiv = doc.createElement("div");
		ScreenshoterDiv.setAttribute("id", ScreenshoterSelector.GRAB_DIV);

		var backgroundDiv = doc.createElement("div");
		backgroundDiv.setAttribute("id", ScreenshoterSelector.BACKGROUND_DIV);
		backgroundDiv.setAttribute("style",
			'background-color:gray;opacity:0.3;position:fixed;z-index:999999; top:0;left:0;width:100%;height:100%;cursor:crosshair;');

		doc.addEventListener("mousedown", ScreenshoterSelector.beginBoxSelect,  true);
		doc.addEventListener("keydown", ScreenshoterSelector.cancelBoxSelect, true);

		//Fix for FF17 bug (with <div contenteditable="true"></div>)
		backgroundDiv.innerHTML = '<span style="display:inline-block;left: 0;position: absolute;top: 0;width: 1px;height: 1px;z-index: 999999;overflow: hidden;">.</span>';

		ScreenshoterDiv.appendChild(backgroundDiv);

		body.appendChild(ScreenshoterDiv);
	},

	beginBoxSelect : function(event) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;
		var selDiv = doc.getElementById(ScreenshoterSelector.SEL_DIV);

		doc.removeEventListener("mousedown", ScreenshoterSelector.beginBoxSelect, true);

		if (selDiv == null) {
			selDiv = doc.createElement("div");
			selDiv.setAttribute("id", ScreenshoterSelector.SEL_DIV);
			selDiv.setAttribute("style",
				'z-index:999999;background-color:#99D;border:1px solid #000;position:absolute;opacity:0.5;margin:0;padding:0;');

			var html = doc.getElementsByTagName("html")[0];
			html.appendChild(selDiv);
		}

		ScreenshoterSelector.originX = event.pageX;
		ScreenshoterSelector.originY = event.pageY;

		ScreenshoterSelector.mouseX = event.pageX;
		ScreenshoterSelector.mouseY = event.pageY;

		ScreenshoterSelector.offsetX = win.pageXOffset || doc.documentElement.scrollLeft;
		ScreenshoterSelector.offsetY = win.pageYOffset || doc.documentElement.scrollTop;


		selDiv.style.display = "none";
		selDiv.style.left = event.pageX + "px";
		selDiv.style.top  = event.pageY + "px";
		doc.addEventListener("mousemove", ScreenshoterSelector.doBoxSelect,     true);
		doc.addEventListener("mouseup",   ScreenshoterSelector.endBoxSelect,    true);
		doc.addEventListener("scroll",    ScreenshoterSelector.scrollBoxDraw,   true);
	},

	doBoxSelect : function(event) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;
		var selDiv = doc.getElementById(ScreenshoterSelector.SEL_DIV);

		ScreenshoterSelector.mouseX = event.pageX;
		ScreenshoterSelector.mouseY = event.pageY;

		var left = ScreenshoterSelector.mouseX < ScreenshoterSelector.originX ? ScreenshoterSelector.mouseX : ScreenshoterSelector.originX;
		var top = ScreenshoterSelector.mouseY < ScreenshoterSelector.originY ? ScreenshoterSelector.mouseY : ScreenshoterSelector.originY;

		var width  = Math.abs(ScreenshoterSelector.mouseX - ScreenshoterSelector.originX);
		var height = Math.abs(ScreenshoterSelector.mouseY - ScreenshoterSelector.originY);

		selDiv.style.display = "none";
		selDiv.style.left    = left + "px";
		selDiv.style.top     = top  + "px";

		selDiv.style.width   = width  + "px";
		selDiv.style.height  = height + "px";
		selDiv.style.display = "inline";

		selDiv.innerHTML = '<nobr style="color: #FFFFFF;display: inline-block; font: 14px/14px Tahoma,sans-serif; background: rgba(200,200,200,0.2); vertical-align: top;">'+ width +'x'+ height +'</nobr>';
	},

	endBoxSelect : function(event) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;

		doc.removeEventListener("mousedown", ScreenshoterSelector.beginBoxSelect, true);
		doc.removeEventListener("mousemove", ScreenshoterSelector.doBoxSelect, true);
		doc.removeEventListener("mouseup",ScreenshoterSelector.endBoxSelect, true);
		doc.removeEventListener("scroll", ScreenshoterSelector.scrollBoxDraw, true);
		doc.removeEventListener("keydown", ScreenshoterSelector.cancelBoxSelect, true);

		ScreenshoterSelector.finishSelect(event);
	},

	scrollBoxDraw: function(event) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;

		var selDiv = doc.getElementById(ScreenshoterSelector.SEL_DIV);
		if (selDiv == null)
			return;

		//scroll event.pageX/Y is undefined in older versions!
		var scrollX = (typeof event.pageX === "undefined" ? 0 : event.pageX);
		var scrollY = (typeof event.pageY === "undefined" ? 0 : event.pageY);

		ScreenshoterSelector.mouseX = ScreenshoterSelector.mouseX + (scrollX - ScreenshoterSelector.offsetX);
		ScreenshoterSelector.mouseY = ScreenshoterSelector.mouseY + (scrollY - ScreenshoterSelector.offsetY);
		ScreenshoterSelector.offsetX = scrollX;
		ScreenshoterSelector.offsetY = scrollY;

		var e = {
			'pageX': ScreenshoterSelector.mouseX,
			'pageY': ScreenshoterSelector.mouseY
		};
		ScreenshoterSelector.doBoxSelect(e);
	},

	finishSelect: function(event){
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;
		var box = null;

		// create a box to hold the dimensions of the box
		var selDiv = doc.getElementById(ScreenshoterSelector.SEL_DIV);
		if (selDiv != null) {
			box = {
				x:      selDiv.offsetLeft,// + offsetX,
				y:      selDiv.offsetTop,//  + offsetY,
				width:  selDiv.clientWidth,
				height: selDiv.clientHeight
			};
		}

		// remove the box div
		var body = doc.getElementsByTagName("html")[0];
		var ScreenshoterDiv = doc.getElementById(ScreenshoterSelector.GRAB_DIV);
		if (ScreenshoterDiv!=null) {
			body.removeChild(ScreenshoterDiv);
		}

		var ScreenshoterSelDiv = doc.getElementById(ScreenshoterSelector.SEL_DIV);
		if (ScreenshoterSelDiv!=null) {
			body.removeChild(ScreenshoterSelDiv);
		}

		if (ScreenshoterSelector.cancel==true) {
			return;
		}

		// take the shot (hopefully everything is clean now)
		if (box != null) {
			if (doc.ScreenshoterOperations){
				var data = [win, box];
				Screenshoter.processOperation(doc.ScreenshoterOperations, data);
			}
		}
	}
}



// ------------------------------------------------------------------



var Screenshoter = {
	pref : Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.getBranch("extensions.web-screenshot."),
	//prefBranch : null,
	debugMode    : false,

	onLoad : function(event) {
		if (!("addObserver" in Screenshoter.pref)) {
			Screenshoter.pref.QueryInterface(Components.interfaces.nsIPrefBranch2);
		}
		Screenshoter.pref.addObserver("", Screenshoter, false);

		setTimeout(function() {
			Screenshoter.refreshContextMenu();
		}, 300);
	},

	onUnload: function(event){
		try {
			Screenshoter.pref.removeObserver("", Screenshoter);
		} catch (e) {
		}
	},

	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed")
			return;

		switch (data) {
			case "showInContextMenu":
				Screenshoter.refreshContextMenu();
			break;
		}
	},

	openOptions: function() {
		var options = "chrome,centerscreen,modal";
		window.openDialog("chrome://web-screenshot/content/options.xul", "", options, {});
	},

	saveComplete: function() {
		Screenshoter.processOperation(["getComplete", "save"]);
	},

	saveVisible: function() {
		Screenshoter.processOperation(["getVisible", "save"]);
	},

	saveSelection: function() {
		Screenshoter.processOperation(["getSelection", "save"]);
	},

	saveAsComplete: function() {
		Screenshoter.processOperation(["getComplete", "saveAs"]);
	},

	saveAsVisible: function() {
		Screenshoter.processOperation(["getVisible", "saveAs"]);
	},

	saveAsSelection: function() {
		Screenshoter.processOperation(["getSelection", "saveAs"]);
	},

	copyComplete: function() {
		Screenshoter.processOperation(["getComplete", "copy"]);
	},

	copyVisible: function() {
		Screenshoter.processOperation(["getVisible", "copy"]);
	},

	copySelection: function() {
		Screenshoter.processOperation(["getSelection", "copy"]);
	},

	saveCompleteJpeg: function() {
		Screenshoter.processOperation(["getComplete", "saveJpeg"]);
	},

	saveCompletePng: function() {
		Screenshoter.processOperation(["getComplete", "savePng"]);
	},

	processOperation: function(operations, data, delay) {
		if (operations.length == 0)
			return;
		if (!delay)
			delay = 0;
		var op = operations.shift();
		setTimeout(Screenshoter.doOperation, delay, op, operations, data);
	},

	doOperation: function(op, operations, data) {
		try {
			Screenshoter[op](operations, data);
		} catch (e) {
		}
	},

	getComplete: function(operations, data) {
		operations = ["getContentFrame", "getCompletePage"].concat(operations);
		Screenshoter.processOperation(operations, data);
	},

	getVisible: function(operations, data) {
		operations = ["getContentWindow", "getVisiblePortion"].concat(operations);
		Screenshoter.processOperation(operations, data);
	},

	getSelection: function(operations, data) {
		var selectOperations;
		selectOperations = ["startSelection"];
		operations = selectOperations.concat(operations);
		Screenshoter.processOperation(operations, data);
	},

	getContentFrame: function(operations, data) {
		var win = document.commandDispatcher.focusedWindow;
		if (!win || !(win.document instanceof HTMLDocument)) {
			win = window.top.getBrowser().selectedBrowser.contentWindow;
		}
		Screenshoter.processOperation(operations, win);
	},

	getContentWindow: function(operations, data) {
		var win = window.top.getBrowser().selectedBrowser.contentWindow;
		Screenshoter.processOperation(operations, win);
	},

	getCompletePage: function(operations, data) {
		var win = data;
		var htmlDoc = win.document;
		var htmlWin = win.content.window;
		var width = Screenshoter.getDocWidth(htmlDoc);
		var height = Screenshoter.getDocHeight(htmlDoc);
		var vWidth = Screenshoter.getViewportWidth(htmlDoc);
		if (vWidth > width)
			width = vWidth;
		var vHeight = Screenshoter.getViewportHeight(htmlDoc);
		if (vHeight > height)
			height = vHeight;
		var box = {
			x : 0,
			y : 0,
			"width" : width,
			"height" : height
		};
		var canvas = Screenshoter.drawToCanvas(htmlWin, box);
		if (canvas !== false)
			Screenshoter.processOperation(operations, canvas);
	},

	getVisiblePortion: function(operations, data) {
		var win = data;
		var htmlDoc = win.document;
		var htmlWin = win.content.window;
		var box = {
			x : htmlWin.scrollX,
			y : htmlWin.scrollY,
			width : Screenshoter.getViewportWidth(htmlDoc),
			height : Screenshoter.getViewportHeight(htmlDoc)
		};
		var canvas = Screenshoter.drawToCanvas(htmlWin, box);
		if (canvas !== false)
			Screenshoter.processOperation(operations, canvas);
	},

	startSelection: function(operations, data) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;
		operations.unshift("finishSelection");
		doc.ScreenshoterOperations = operations;
		doc.ScreenshoterData = data;
		ScreenshoterSelector.startSelect();
	},

	finishSelection: function(operations, data){
		var win = data[0]
		var box = data[1];
		var htmlDoc = win.document;
		var htmlWin = win.content.window;
		var canvas = Screenshoter.drawToCanvas(htmlWin, box);
		if (canvas !== false)
			Screenshoter.processOperation(operations, canvas);
	},

	save: function(operations, data) {
		var canvas = data;
		var file = Screenshoter.getNewFile();

		Screenshoter.saveCanvas(canvas, file, Screenshoter.getDefaultMimeType());
		Screenshoter.processOperation(operations, file);
	},

	saveTemp: function(operations, data) {
		var canvas = data;
		var file = Screenshoter.getTempFile();

		Screenshoter.saveCanvas(canvas, file, Screenshoter.getDefaultMimeType());
		Screenshoter.processOperation(operations, file);
	},

	saveAs: function(operations, data) {
		var canvas = data;

		var fp = Components.classes["@mozilla.org/filepicker;1"]
			.createInstance(Components.interfaces.nsIFilePicker);

		fp.init(window, "Save As", Components.interfaces.nsIFilePicker.modeSave);
		fp.defaultString = Screenshoter.getNewFileName();
		fp.appendFilter("PNG", "*.png");
		fp.appendFilter("JPG", "*.jpg");
		if (Screenshoter.getDefaultMimeType() == "image/png") {
			fp.filterIndex = 0;
		}
		else {
			fp.filterIndex = 1;
		}
		var result = fp.show();
		if (result == fp.returnOK || result == fp.returnReplace) {
			var file = fp.file;
			var type = "image/png";
			var path = file.path;
			if (fp.filterIndex == 1) {
				type = "image/jpeg";
				if (path.substr(path.lastIndexOf(".")).toLowerCase() != ".jpg") {
					path += ".jpg";
				}
			}
			else {
				type = "image/png";
				if (path.substr(path.lastIndexOf(".")).toLowerCase() != ".png") {
					path += ".png";
				}
			}
			file = Components.classes["@mozilla.org/file/local;1"]
					.createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(path);
			Screenshoter.saveCanvas(canvas, file, type);
			Screenshoter.processOperation(operations, file);
		}
	},

	savePng: function(operations, data){
		var canvas = data;
		var type = "image/png";
		var file = Screenshoter.getNewFile(type);

		Screenshoter.saveCanvas(canvas, file, type);
		Screenshoter.processOperation(operations, file);
	},

	saveJpeg: function(operations, data){
		var canvas = data;
		var type = "image/jpeg";
		var file = Screenshoter.getNewFile(type);

		Screenshoter.saveCanvas(canvas, file, type);
		Screenshoter.processOperation(operations, file);
	},

	copy: function(operations, data) {
		var canvas = data;

		var dataUrl = canvas.toDataURL("image/png", "");
		var image = window.content.document.createElement("img");
		image.setAttribute("style", "display: none");
		image.setAttribute("id", "screengrab_buffer");
		image.setAttribute("src", dataUrl);
		var body = window.content.document.getElementsByTagName("html")[0];
		body.appendChild(image);

		operations.unshift("finishCopy");
		Screenshoter.processOperation(operations, image, 1000);
	},

	finishCopy: function(operations, data) {
		var image = data;

		document.popupNode = image;
		try {
			goDoCommand('cmd_copyImageContents');
		} catch (ex) {}
		var parent = image.parentNode;
		parent.removeChild(image);
		Screenshoter.processOperation(operations, image, 200);
	},

	getDocWidth: function(doc) {
		return (doc.compatMode == "CSS1Compat")
				? doc.documentElement.scrollWidth
				: doc.body.scrollWidth;
	},

	getDocHeight: function(doc) {
		return (doc.compatMode == "CSS1Compat")
				? doc.documentElement.scrollHeight
				: doc.body.scrollHeight;
	},

	getViewportHeight: function(doc) {
		return (doc.compatMode == "CSS1Compat")
				? doc.documentElement.clientHeight
				: doc.body.clientHeight;
	},

	getViewportWidth: function(doc) {
		return (doc.compatMode == "CSS1Compat")
				? doc.documentElement.clientWidth
				: doc.body.clientWidth;
	},

	getZoom: function() {
		var zoom = 1.0;
		try{
			var disabled = Screenshoter.pref.getBoolPref("fix_disable_zoom");
			if (disabled)
				return zoom;
		} catch(e){}

		try {
			var docViewer = gBrowser.selectedBrowser.markupDocumentViewer;
			zoom = docViewer.fullZoom;
			return zoom;
		} catch (e) {
			try {
				var docViewer = gBrowser.selectedBrowser;
				var zoom = docViewer.fullZoom;
				if (parseFloat(zoom) == zoom) {
					return zoom;
				}
				return 1.0;
			} catch (e) {
				return 1.0;
			}
		}
	},

	drawToCanvas: function(win, box) {
		box.zoom = Screenshoter.getZoom();
		box.width  = box.width  * box.zoom;
		box.height = box.height * box.zoom;

		//sanity check (though will fail on much smaller)
		if (box.width  > 32760) { box.width  = 32760; }
		if (box.height > 32760) { box.height = 32760; }

		var canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "html:canvas");
		canvas.style.width  = box.width  + "px";
		canvas.style.height = box.height + "px";
		canvas.width  = box.width;
		canvas.height = box.height;

		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, box.width, box.height);
		ctx.scale(box.zoom, box.zoom);
		if ( box.zoom && (box.zoom != 0) ) {
			box.width  = box.width  / box.zoom;
			box.height = box.height / box.zoom;
		}
		ctx.save();
		try {
			ctx.drawWindow(win, box.x, box.y, box.width, box.height, "rgba(0,0,0,0)");
		} catch(e) {
			Screenshoter.showNotificationPopup('Internal canvas.drawWindow call failed!', false);
			return false;
		}
		ctx.restore();
		return canvas;
	},

	getNewFileName: function(type) {
		var win = Screenshoter.getWindowsContent();
		var doc = win.document;

		var d = new Date();
		var dateString = [
			d.getFullYear(),
			("0" + (d.getMonth()+1)).slice(-2),
			("0" +  d.getDate()    ).slice(-2)
		].join("-");
		var timeString = [
			("0" +  d.getHours()   ).slice(-2),
			("0" +  d.getMinutes() ).slice(-2),
			("0" +  d.getSeconds() ).slice(-2)
		].join("-");

		var domain = doc.domain;
		if ((typeof domain === "undefined") || !domain)
			domain = "screen_";
		else {
			// Replace invalid characters  \ / : * ? ' " < > |  with underscore
			domain = domain.replace(/[\/\\\:\*\?\'\"\<\>\|\s]/g, '_').replace(/_+/g, '_')+'_';
		}

		var title = doc.title;
		if ((typeof title === "undefined") || !title)
			title = "screen_";
		else {
			// Replace invalid characters  \ / : * ? ' " < > |  with underscore
			title = title.replace(/[\/\\\:\*\?\'\"\<\>\|\s]/g, '_').replace(/_+/g, '_')+'_';
			title = title.substr(0, 30);
		}


		var name;
		var template = Screenshoter.getFileTemplate();
		if (template == 'date')
			name = dateString+"_"+timeString;
		else if (template == 'title')
			name = title+""+dateString+"_"+timeString;
		else
			name = domain+""+dateString+"_"+timeString;

		if (!type || (type!="image/png" && type!="image/jpeg"))
			type = Screenshoter.getDefaultMimeType();
		if (type == "image/png") {
			name += ".png";
		} else {
			name += ".jpg";
		}
		return name;
	},

	getNewFile: function(type) {
		var file = Screenshoter.getSaveFolder();
		file.append(Screenshoter.getNewFileName(type));
		return file;
	},

	getTempFile: function() {
		var file = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties).get("TmpD",
						Components.interfaces.nsIFile);
		file.append(Screenshoter.getNewFileName());
		file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0666", 8));
		return file;
	},

	saveCanvas: function(canvas, file, mimeType) {
		// create a data url from the canvas and then create URIs of the source and targets
		var io = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService);


		//https://bugzilla.mozilla.org/show_bug.cgi?id=564388
		//Firefox <=6? has known bug - toDataURL() fails when has params
		try {
			var source = io.newURI(canvas.toDataURL(mimeType, Screenshoter.getJPGImageQuality(mimeType)), "UTF8", null);
		} catch(e) {
			var source = io.newURI(canvas.toDataURL(mimeType), "UTF8", null);
		}

		var target = io.newFileURI(file)

		// prepare to save the canvas data
		var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
				.createInstance(Components.interfaces.nsIWebBrowserPersist);

		persist.persistFlags = Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
		persist.persistFlags |= Components.interfaces.nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;

		if ( Screenshoter.isDownloadManagerUsed() ) {
			// displays a download dialog (remove these 3 lines for silent download)
			var xfer = Components.classes["@mozilla.org/transfer;1"]
				.createInstance(Components.interfaces.nsITransfer);
			xfer.init(source, target, "Screenshot", null, new Date(), null, persist, null);
			persist.progressListener = xfer;
		}

		// save the canvas data to the file
		var nsILoadContext = null;
		try {
			var getMainWindow = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");

			try {
				nsILoadContext = getMainWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsILoadContext);
			} catch(e) {
				Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
				nsILoadContext = PrivateBrowsingUtils.getPrivacyContextFromWindow(getMainWindow);
			};
		} catch(e) {};

		try {
			// for Firefox 18.0 - 36.0
			persist.saveURI(source, null, null, null, null, file, nsILoadContext);
		} catch(e) {
			try {
				// for Firefox 36.0+
				persist.saveURI(source, null, null, null, null, null, file, nsILoadContext);
			}
			catch(e) {
				// for Firefox 4.0 - 18.0
				persist.saveURI(source, null, null, null, null, file);
			}
		}
		if (Screenshoter.getNotificationType() == "popup") {
			Screenshoter.imgfile = file;
			Screenshoter.showNotificationPopup("Screenshot saved", true);
		}
	},

	showNotificationPopup: function(message, filedlg) {
		var alertsService = Components.classes["@mozilla.org/alerts-service;1"]
				.getService(Components.interfaces.nsIAlertsService);
		try {
			if (filedlg)
				alertsService.showAlertNotification("chrome://web-screenshot/skin/shot_24x24.png", "Web Screenshot", message, true, "", Screenshoter.createAlertListener(), "Web Screenshot notification");
			else
				alertsService.showAlertNotification("chrome://web-screenshot/skin/shot_24x24.png", "Web Screenshot", message, false, "", null, "Web Screenshot notification");
		} catch(e) {}
	},

	createAlertListener: function() {
		var listener = {
			aFile: Screenshoter.imgfile,
			observe: function(subject, topic, data) {
				if (topic == 'alertclickcallback') {
					this.openDir(this.aFile);
				}
			},
			openDir: function(file) {
				try {
					file.reveal();
				} catch(e) {
					var uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(file.parent);
					var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
					protocolSvc.loadUrl(uri);
				}
			}
		};
		return listener;
	},

	onButClick: function(event){
		var operations = [Screenshoter.getDefaultTarget(), Screenshoter.getDefaultAction()];
		Screenshoter.processOperation(operations);
	},

	getNotificationType: function(){
		var type = "off";
		try{
			type = Screenshoter.pref.getCharPref("notificationType");
		} catch(e){
		}
		if (type!="off" && type!="popup")
			type = "off";
		return type;
	},

	getDefaultMimeType: function() {
		var type = "image/png";
		try{
			type = Screenshoter.pref.getCharPref("defaultType");
		} catch(e){
		}
		if (type!="image/png" && type!="image/jpeg")
			type = "image/png";
		return type;
	},

	getDefaultTarget: function(){
		var target = "getComplete";
		try{
			target = Screenshoter.pref.getCharPref("defaultTarget");
		} catch(e){
		}
		if (!target)
			target = "getComplete";
		return target;
	},

	getDefaultAction: function(){
		var action = "save";
		try{
			action = Screenshoter.pref.getCharPref("defaultAction");
		} catch(e){
		}
		if (!action)
			action = "save";
		return action;
	},

	getDefaultFolder: function() {
		var file = null;
		try {
			file = Components.classes["@mozilla.org/file/directory_service;1"]
					.getService(Components.interfaces.nsIProperties).get(
							"Desk", Components.interfaces.nsIFile);
		} catch (e) {
			try {
				file = Components.classes["@mozilla.org/file/directory_service;1"]
						.getService(Components.interfaces.nsIProperties).get(
								"TmpD", Components.interfaces.nsIFile);
			} catch (e) {
			}
		}
		return file;
	},

	getSaveFolder: function(){
		var fileName = null;
		try {
			fileName = Screenshoter.pref.getComplexValue("defaultFolder",
					Components.interfaces.nsISupportsString).data;
		} catch (e) {
		}

		var file;
		if (fileName == null || fileName.length == 0) {
			file = Screenshoter.getDefaultFolder();
		}
		else {
			file = Components.classes["@mozilla.org/file/local;1"]
						.createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(fileName);
			if (file.exists()){
				if (!file.isWritable()|| !file.isDirectory())
					file = Screenshoter.getDefaultDir();
			}
			else{
				try{
					file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0775", 8));
				} catch(e){
					file = Screenshoter.getDefaultDir();
				}
			}
		}
		if (!file.exists()) {
			file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt("0775", 8));
		}
		Screenshoter.setUnicharPref("defaultFolder", file.path);
		return file;
	},

	setUnicharPref : function(prefName, value) {
		var str = Components.classes["@mozilla.org/supports-string;1"]
					.createInstance(Components.interfaces.nsISupportsString);
		str.data = value;
		Screenshoter.pref.setComplexValue(prefName, Components.interfaces.nsISupportsString, str);
	},

	setSaveFolder: function(dir) {
		Screenshoter.setUnicharPref("defaultFolder", dir);
	},

	isDownloadManagerUsed: function(){
		var u = true;
		try{
			u = Screenshoter.pref.getBoolPref("showInDLManager");
		} catch(e){
		}
		return u;
	},

	isShown_in_contextmenu: function(){
		var u = true;
		try{
			u = Screenshoter.pref.getBoolPref("showInContextMenu");
		} catch(e){
		}
		return u;
	},

	getJPGImageQuality: function(mimeType){
		if (mimeType == "image/png") {
			return "";
		}
		var u = 90;
		try{
			u = Screenshoter.pref.getIntPref("JPGImageQuality");
		} catch(e){
		}
		return u/100;
	},

	getFileTemplate: function() {
		var value = "domain";
		try{
			value = Screenshoter.pref.getCharPref("filenameTemplate");
		} catch(e){
		}
		if (!value)
			value = "domain";
		return value;
	},

	refreshContextMenu: function() {
		try {
			if ( Screenshoter.isShown_in_contextmenu() ) {
				document.getElementById("screenshot-contextmenu1").style.display = "";
			}
			else {
				document.getElementById("screenshot-contextmenu1").style.display = "none";
			}
		} catch(e) {
		}
	},

	getWindowsContent: function() {
		//var win = window._content;
		var win = window.content;
		return win;
	},

	get_is_e10s: function() {
		var prefs_global = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefBranch);
		var is_e10s = false;
		try {
			is_e10s = prefs_global.getBoolPref('browser.tabs.remote.autostart');
		} catch(e) {};
		return is_e10s;
	}
};
