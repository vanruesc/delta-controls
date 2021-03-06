import { EventDispatcher } from "three";

/**
 * JSON representation of zoom settings.
 *
 * @ignore
 */

export interface ZoomSettingsJSON {

	enabled: boolean;
	inverted: boolean;
	minDistance: number;
	maxDistance: number;
	sensitivity: number;

}

/**
 * Zoom settings.
 */

export class ZoomSettings extends EventDispatcher {

	/**
	 * Whether zooming is enabled.
	 */

	private enabled: boolean;

	/**
	 * Indicates whether the zoom controls should be inverted.
	 */

	private inverted: boolean;

	/**
	 * The minimum zoom distance.
	 */

	private minDistance: number;

	/**
	 * The maximum zoom distance.
	 */

	private maxDistance: number;

	/**
	 * The zoom sensitivity.
	 */

	private sensitivity: number;

	/**
	 * Constructs new zoom settings.
	 */

	constructor() {

		super();

		this.enabled = true;
		this.inverted = false;
		this.minDistance = 1e-6;
		this.maxDistance = Number.POSITIVE_INFINITY;
		this.sensitivity = 1.0;

	}

	/**
	 * Indicates whether zooming is enabled.
	 *
	 * @return Whether zooming is enabled.
	 */

	isEnabled(): boolean {

		return this.enabled;

	}

	/**
	 * Enables or disables zooming.
	 *
	 * @param value - The value.
	 */

	setEnabled(value: boolean): void {

		this.enabled = value;
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Indicates whether the zoom controls should be inverted.
	 *
	 * @return Whether zooming is enabled.
	 */

	isInverted(): boolean {

		return this.inverted;

	}

	/**
	 * Defines whether the zoom controls should be inverted.
	 *
	 * @param value - The value.
	 */

	setInverted(value: boolean): void {

		this.inverted = value;
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Returns the minimum zoom distance.
	 *
	 * @return The distance.
	 */

	getMinDistance(): number {

		return this.minDistance;

	}

	/**
	 * Sets the minimum zoom distance.
	 *
	 * @param value - The distance. Must be greater than zero.
	 */

	setMinDistance(value: number): void {

		this.minDistance = Math.min(Math.max(value, 1e-6), Number.POSITIVE_INFINITY);
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Returns the maximum zoom distance.
	 *
	 * @return The distance.
	 */

	getMaxDistance(): number {

		return this.maxDistance;

	}

	/**
	 * Sets the maximum zoom distance.
	 *
	 * @param value - The distance. Must be greater than the minimum distance.
	 */

	setMaxDistance(value: number): void {

		this.maxDistance = Math.min(Math.max(value, this.minDistance), Number.POSITIVE_INFINITY);
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Sets the minimum and maximum zoom distance.
	 *
	 * @param min - The minimum distance.
	 * @param max - The maximum distance.
	 */

	setRange(min: number, max: number): void {

		this.minDistance = min;
		this.maxDistance = max;
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Returns the zoom sensitivity.
	 *
	 * @return The sensitivity.
	 */

	getSensitivity(): number {

		return this.sensitivity;

	}

	/**
	 * Sets the zoom sensitivity.
	 *
	 * @param value - The sensitivity.
	 */

	setSensitivity(value: number): void {

		this.sensitivity = value;
		this.dispatchEvent({ type: "change" });

	}

	/**
	 * Copies the given zoom settings.
	 *
	 * @param settings - Zoom settings.
	 * @return This instance.
	 */

	copy(settings: ZoomSettings): ZoomSettings {

		this.enabled = settings.isEnabled();
		this.inverted = settings.isInverted();
		this.minDistance = settings.getMinDistance();
		this.maxDistance = settings.getMaxDistance();
		this.sensitivity = settings.getSensitivity();

		return this;

	}

	/**
	 * Clones this zoom settings instance.
	 *
	 * @return The cloned zoom settings.
	 */

	clone(): ZoomSettings {

		const clone = new ZoomSettings();

		return clone.copy(this);

	}

	/**
	 * Copies the given JSON data.
	 *
	 * @param json - The JSON data.
	 * @return This instance.
	 */

	fromJSON(json: ZoomSettingsJSON): ZoomSettings {

		this.enabled = json.enabled;
		this.inverted = json.inverted;
		this.minDistance = json.minDistance;
		this.maxDistance = json.maxDistance || Number.POSITIVE_INFINITY;
		this.sensitivity = json.sensitivity;

		return this;

	}

	toJSON(): Record<string, unknown> {

		return {
			enabled: this.enabled,
			inverted: this.inverted,
			minDistance: this.minDistance,
			maxDistance: this.maxDistance,
			sensitivity: this.sensitivity
		};

	}

}
