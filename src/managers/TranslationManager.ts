import {
	Event as Event3,
	EventDispatcher,
	Quaternion,
	Vector3
} from "three";

import { MovementState } from "./MovementState";
import { ControlMode } from "../core";
import { Settings } from "../settings";
import { Updatable } from "../core";
import { MILLISECONDS_TO_SECONDS } from "../core/time";
import * as axes from "../core/axes";

const v = new Vector3();

/**
 * A translation manager.
 */

export class TranslationManager extends EventDispatcher implements Updatable {

	/**
	 * The position that will be modified.
	 */

	private position: Vector3;

	/**
	 * The quaternion that will be modified.
	 */

	private quaternion: Quaternion;

	/**
	 * The target.
	 */

	private target: Vector3;

	/**
	 * The settings.
	 */

	private settings: Settings;

	/**
	 * The current movement state.
	 */

	private movementState: MovementState;

	/**
	 * A timestamp.
	 */

	private timestamp: number;

	/**
	 * A reusable update event.
	 */

	private updateEvent: Event3;

	/**
	 * Constructs a new translation manager.
	 *
	 * @param position - The position.
	 * @param quaternion - The quaternion.
	 * @param target - The target.
	 * @param settings - The settings.
	 */

	constructor(position: Vector3, quaternion: Quaternion, target: Vector3,
		settings: Settings) {

		super();

		this.position = position;
		this.quaternion = quaternion;
		this.target = target;
		this.settings = settings;
		this.movementState = new MovementState();
		this.timestamp = 0;
		this.updateEvent = { type: "update" };

	}

	/**
	 * Returns the movement state.
	 *
	 * @return The movement state.
	 */

	getMovementState(): MovementState {

		return this.movementState;

	}

	/**
	 * Sets the position.
	 *
	 * @param position - A position.
	 * @return This manager.
	 */

	setPosition(position: Vector3): TranslationManager {

		this.position = position;

		return this;

	}

	/**
	 * Sets the quaternion.
	 *
	 * @param quaternion - A quaternion.
	 * @return This manager.
	 */

	setQuaternion(quaternion: Quaternion): TranslationManager {

		this.quaternion = quaternion;

		return this;

	}

	/**
	 * Sets the target.
	 *
	 * @param target - A target.
	 * @return This manager.
	 */

	setTarget(target: Vector3): TranslationManager {

		this.target = target;

		return this;

	}

	/**
	 * Translates a position by a specific distance along a given axis.
	 *
	 * @param axis - The axis.
	 * @param distance - The distance.
	 */

	private translateOnAxis(axis: Vector3, distance: number): void {

		v.copy(axis).applyQuaternion(this.quaternion).multiplyScalar(distance);
		this.position.add(v);

		if(this.settings.general.getMode() === ControlMode.THIRD_PERSON) {

			// Move the target together with the position.
			this.target.add(v);

		}

		this.dispatchEvent(this.updateEvent);

	}

	/**
	 * Modifies the position based on the current movement state and elapsed time.
	 *
	 * @param deltaTime - The time since the last update in seconds.
	 */

	private translate(deltaTime: number): void {

		const state = this.movementState;
		const translation = this.settings.translation;
		const boost = state.boost ? translation.getBoostMultiplier() : 1.0;
		const sensitivity = translation.getSensitivity();

		const step = deltaTime * sensitivity * boost;

		if(state.backward && state.forward) {

			if(state.backwardBeforeForward) {

				this.translateOnAxis(axes.z, step);

			} else {

				this.translateOnAxis(axes.z, -step);

			}

		} else if(state.backward) {

			this.translateOnAxis(axes.z, step);

		} else if(state.forward) {

			this.translateOnAxis(axes.z, -step);

		}

		if(state.right && state.left) {

			if(state.rightBeforeLeft) {

				this.translateOnAxis(axes.x, step);

			} else {

				this.translateOnAxis(axes.x, -step);

			}

		} else if(state.right) {

			this.translateOnAxis(axes.x, step);

		} else if(state.left) {

			this.translateOnAxis(axes.x, -step);

		}

		if(state.up && state.down) {

			if(state.upBeforeDown) {

				this.translateOnAxis(axes.y, step);

			} else {

				this.translateOnAxis(axes.y, -step);

			}

		} else if(state.up) {

			this.translateOnAxis(axes.y, step);

		} else if(state.down) {

			this.translateOnAxis(axes.y, -step);

		}

	}

	/**
	 * Moves to the given position.
	 *
	 * @param p - The position.
	 * @return This instance.
	 */

	moveTo(position: Vector3): TranslationManager {

		if(this.settings.general.getMode() === ControlMode.THIRD_PERSON) {

			v.subVectors(position, this.target);
			this.target.copy(position);
			this.position.add(v);

		} else {

			this.position.copy(position);

		}

		this.dispatchEvent(this.updateEvent);

		return this;

	}

	update(timestamp: number): void {

		if(this.settings.translation.isEnabled()) {

			const elapsed = (timestamp - this.timestamp) * MILLISECONDS_TO_SECONDS;
			this.translate(elapsed);

		}

		this.timestamp = timestamp;

	}

}
