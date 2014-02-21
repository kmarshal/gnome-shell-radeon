// author: Kamil Marszałkowski

const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop

function init() {
	return new ExtensionController();
}

function ExtensionController() {
	return {
		extension: null,
		settings: null,

		enable: function() {
			this.extension = new RadeonExtension();
			Main.panel.addToStatusArea("radeonControl", this.extension, 0, "right");
			Main.panel.menuManager.addMenu(this.extension.menu);
		},

		disable: function() {
			Main.panel.menuManager.removeMenu(this.extension.menu);
			GLib.source_remove(this.extension.event);
			this.extension.actor.destroy();
			this.extension = null;
		}
	}
}


// Extension
function RadeonExtension() {
	this._init();
}
RadeonExtension.prototype = {
	__proto__: PanelMenu.Button.prototype,

	_init: function() {
		PanelMenu.Button.prototype._init.call(this, 0.0);		
		this.panelContainer = new St.BoxLayout();
		this.actor.add_actor(this.panelContainer);
		this.panelLabel = new St.Label({style_class: "radeon-label", text: _("GPU:")});
		this.currentActivity = null;
		this.panelContainer.add(this.panelLabel);
		this.event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, this.updateTempLabel));
		this.updateTempLabel();
		this._setPopupUI();
	},

	_setPopupUI: function() {
		let fanLabel = new PopupMenu.PopupBaseMenuItem();
		fanLabel.addActor(new St.Label({text: _("Fan speed")}));

		this._fanSlider = new FanSlider(this.getFanSpeed());
		this._fanSlider.connect('value-changed', Lang.bind(this, this.onSliderValueChanged)); // label update
		this._fanSlider.connect("drag-end", Lang.bind(this, this.onSliderDragEnd)); // run command
		
		this.menu.addMenuItem(fanLabel);
		this.menu.addMenuItem(this._fanSlider);
	},
	
	updateTempLabel: function() {
		let output = GLib.spawn_command_line_sync("aticonfig --odgt");
		let temp = /Temperature - ([0-9C. ]*)/.exec(output)
		if (temp[1]) {
			this.panelLabel.set_text("GPU: " + temp[1]);
		} else {
			Main._logDebug(temp);
		}
		return true;
	},

	onSliderValueChanged: function (slider, value) {
		this._fanSlider._label.set_text(Math.round(value*100).toString()+"%");
	},
	
	onSliderDragEnd: function (slider) {
		let val = Math.round(slider.value*100);
		this.setFanSpeed(val);
	},
	
	setFanSpeed: function(value) {
		let cmd = "aticonfig --pplib-cmd \"set fanspeed 0 " + value + "\"";
		let output = GLib.spawn_command_line_sync(cmd);
		Main._logDebug(output);
	},
	
	getFanSpeed: function() {
		let cmd = "aticonfig --pplib-cmd \"get fanspeed 0\"";
		let output = GLib.spawn_command_line_sync(cmd);
		let speed = /Fan Speed: ([0-9]*)/.exec(output);
		if (speed[1]) {
			return speed[1];
		} else {
			Main._logDebug(speed+" output: "+output);
			return 55;
		}
	}
}

// Fan speed slider
function FanSlider(val) {
	this._init(val);
}
FanSlider.prototype = {
	__proto__: PopupMenu.PopupSliderMenuItem.prototype,

	_init: function(val) {
		PopupMenu.PopupSliderMenuItem.prototype._init.call(this, val/100);
		this.removeActor(this._slider);
		this._holder = new St.BoxLayout();
        this._label = new St.Label({text: val.toString()+"%", style_class: "label-class", reactive: true});
        this._holder.add_actor(this._label);
        this.addActor(this._slider, { span: 1, expand: false, align: St.Align.START });
        this.addActor(this._holder);
	}
}
