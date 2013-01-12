
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

/*function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
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
	__proto__: PanelMenu.Button.prototype,

	_init: function() {
		PanelMenu.Button.prototype._init.call(this, 0.0);

		//this.extensionMeta = extensionMeta;
		
		this.panelContainer = new St.BoxLayout();
		this.actor.add_actor(this.panelContainer);

		this.panelLabel = new St.Label({style_class: "radeon-label", text: _("GPU:")});
		this.currentActivity = null;

		// icon
		/*this.icon = new St.Icon({ icon_name: 'system-run',
                             icon_type: St.IconType.SYMBOLIC,
                             style_class: 'system-status-icon' });

		this.panelContainer.add(this.icon);*/
		this.panelContainer.add(this.panelLabel);

		this.event = GLib.timeout_add_seconds(0, 5, Lang.bind(this, this.getTemperature));
		this.getTemperature();

	},

	getTemperature: function() {
		let output = GLib.spawn_command_line_sync("aticonfig --odgt");
		let reg = new RegExp("Temperature - ([0-9C. ]*)","g");
		let temp = reg.exec(output); 
		if (temp[1]) {
			var label = "GPU: " + temp[1];
			this.panelLabel.set_text(label);
		} else {
			global.log(temp);
		}
		return true;
	}

}

