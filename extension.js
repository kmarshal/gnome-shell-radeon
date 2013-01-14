
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop

var ext;
var btn;

function init() {
	return new ExtensionController();
	//ext = new RadeonExtension();
}

/*function enable() {

	btn = new PanelMenu.Button({label: "label"});
	btn.label = "dasd";
	let item = new PopupMenu.PopupSliderMenuItem(0);
	btn.menu.addMenuItem(item);
    Main.panel._rightBox.insert_child_at_index(btn.actor, 0);
}

function disable() {
    //Main.panel._rightBox.remove_child(ext.actor);
    Main.panel._rightBox.remove_child(btn.actor);
	//GLib.source_remove(ext.event);
}*/

// =========
function ExtensionController() {
	return {
		//extensionMeta: extensionMeta,
		extension: null,
		settings: null,

		enable: function() {
			this.extension = new RadeonExtension();

			Main.panel._rightBox.insert_child_at_index(this.extension.actor, 0);
			//Main.panel._menus.addMenu(this.extension.menu);
		},

		disable: function() {
			Main.panel._rightBox.remove_actor(this.extension.actor);
			GLib.source_remove(this.extension.event);
			//Main.panel._menus.removeMenu(this.extension.menu);
			
			// Causing reference error
			//this.extension.actor.destory(); 
		}
	}
}

function RadeonExtension() {
	this._init();
}

RadeonExtension.prototype = {
	//__proto__: PopupMenu.PopupBaseMenuItem.prototype,
	__proto__: PanelMenu.Button.prototype,

	_init: function() {
		//PopupMenu.PopupBaseMenuItem.prototype._init.call(this, 0.0);
		PanelMenu.Button.prototype._init.call(this, 0.0);

		//this.extensionMeta = extensionMeta;
		
		this.panelContainer = new St.BoxLayout();
		this.actor.add_actor(this.panelContainer);

		this.panelLabel = new St.Label({style_class: "radeon-label", text: _("GPU:")});
		this.currentActivity = null;

		//this.panelContainer.add(this.icon);
		this.panelContainer.add(this.panelLabel);

		this.event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, this.setTemp));
		this.setTemp();
		
		this._setPopupUI();
	},

	setTemp: function() {
		let output = GLib.spawn_command_line_sync("aticonfig --odgt");
		let temp = /Temperature - ([0-9C. ]*)/.exec(output)
		if (temp[1]) {
			this.panelLabel.set_text("GPU: " + temp[1]);
		} else {
			global.log(temp);
		}
		return true;
	},
	
	_setPopupUI: function() {
		// fan label
		let fanLabel = new PopupMenu.PopupBaseMenuItem();
		let fanIcon = new St.Icon({
			icon_name: 'system-run',
			icon_type: St.IconType.SYMBOLIC,
			style_class: 'system-status-icon'
		});
		fanLabel.addActor(fanIcon);
		fanLabel.addActor(new St.Label({text: _("Fan speed")}));
		
		// fan slider
		this._volume = 0.2;
		this._fanSlider = new PopupMenu.PopupSliderMenuItem(this._volume);
		//fanSlider.setActive(true);
		//fanSlider._activitable = true;
		this._fanSlider.connect('value-changed', Lang.bind(this, this._onSliderValueChanged)); // label update
		this._fanSlider.connect("drag-end", Lang.bind(this, function(){
			this.emit("drag-end", this._value);
		})); // run command
		
		this.menu.addMenuItem(fanLabel);
		this.menu.addMenuItem(this._fanSlider);
	},

	_onSliderValueChanged: function(slider, value) {
		this._volume = value;
	}

}

function FanSlider() {
	this._init();
}

FanSlider.prototype = {
	__proto__: PopupMenu.PopupSliderMenuItem.prototype,

	_init: function() {
		PopupMenu.PopupSliderMenuItem.prototype._init.call(this, 0.2);

		//this._activitable = true;

		this.removeActor(this._slider);
		this._holder = new St.BoxLayout();

        /*this._icon = new St.Icon({
            icon_type: St.IconType.SYMBOLIC,
            icon_size: 12,
            icon_name: icon,
            style_class: 'system-status-icon'});
        this._holder.add_actor(this._icon);*/

        this._label = new St.Label({text: "Label", style_class: "label-class"});
        this._holder.add_actor(this._label);
        this.addActor(this._slider, { span: 1, expand: false, align: St.Align.START });
        this.addActor(this._holder);
	}
}
