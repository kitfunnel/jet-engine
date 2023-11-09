import switcher from "./controls/switcher";
import checkbox from "./controls/checkbox";
import radio from "./controls/radio";
import slider from "./controls/slider";
import select from "./controls/select";
import media from "./controls/media";
import colorpicker from "./controls/colorpicker";
import iconpicker from "./controls/iconpicker";
import dimensions from "./controls/dimensions";
import wysiwyg from "./controls/wysiwyg";
import repeater from "./controls/repeater";
import text from "./controls/text";

const Control = {
	init: function () {
		this.switcher.init();
		this.checkbox.init();
		this.radio.init();
		this.slider.init();
		this.select.init();
		this.media.init();
		this.colorpicker.init();
		this.iconpicker.init();
		this.dimensions.init();
		this.wysiwyg.init();
		this.repeater.init();
		this.text.init();
	},

	switcher,
	checkbox,
	radio,
	slider,
	select,
	media,
	colorpicker,
	iconpicker,
	dimensions,
	wysiwyg,
	repeater,
	text,
};

export default Control;