import {
	EventDispatcher,
	Quaternion,
	Vector2,
	Vector3
} from "three";

import {
	BoostStrategy,
	MovementStrategy,
	Strategy,
	ZoomStrategy
} from "../strategies";

import { PointerButton } from "../input/PointerButton";
import { RotationManager, TranslationManager } from "../managers";
import { Settings } from "../settings/Settings";
import { Action } from "./Action";
import { ControlMode } from "./ControlMode";
import { Direction } from "./Direction";
import { Disposable } from "./Disposable";
import { PointerBehaviour } from "./PointerBehaviour";
import { Updatable } from "./Updatable";

const v = new Vector3();

/**
 * Spatial controls for 3D translation and rotation.
 *
 * This class emits "update" events during interaction.
 */

export class SpatialControls extends EventDispatcher
	implements Disposable, EventListenerObject, Updatable {

	/**
	 * A DOM element. Acts as the primary event target.
	 */

	private domElement: HTMLElement;

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
	 * A rotation manager.
	 */

	private rotationManager: RotationManager;

	/**
	 * A translation manager.
	 */

	private translationManager: TranslationManager;

	/**
	 * A map that links actions to specific strategies.
	 */

	private strategies: Map<Action, Strategy>;

	/**
	 * A screen position.
	 */

	private lastScreenPosition: Vector2;

	/**
	 * Indicates whether the user is currently holding the pointer button down.
	 */

	private dragging: boolean;

	/**
	 * The internal enabled state.
	 */

	private enabled: boolean;

	/**
	 * The control settings.
	 */

	settings: Settings;

	/**
	 * Constructs new controls.
	 *
	 * @param position - A position.
	 * @param quaternion - A quaternion.
	 * @param domElement - A DOM element. Acts as the primary event target.
	 */

	constructor(position: Vector3 = null, quaternion: Quaternion = null,
		domElement: HTMLElement = document.body) {

		super();

		this.domElement = domElement;
		const settings = this.settings = new Settings();
		settings.addEventListener("change", e => this.handleEvent(e as Event));

		this.position = position;
		this.quaternion = quaternion;
		this.target = new Vector3();

		this.rotationManager = new RotationManager(
			position,
			quaternion,
			this.target,
			settings
		);

		this.translationManager = new TranslationManager(
			position,
			quaternion,
			this.target,
			settings
		);

		const rm = this.rotationManager, tm = this.translationManager;
		rm.addEventListener("update", e => this.dispatchEvent(e));
		tm.addEventListener("update", e => this.dispatchEvent(e));

		const state = tm.getMovementState();

		this.strategies = new Map<Action, Strategy>([
			[Action.MOVE_FORWARD, new MovementStrategy(state, Direction.FORWARD)],
			[Action.MOVE_LEFT, new MovementStrategy(state, Direction.LEFT)],
			[Action.MOVE_BACKWARD, new MovementStrategy(state, Direction.BACKWARD)],
			[Action.MOVE_RIGHT, new MovementStrategy(state, Direction.RIGHT)],
			[Action.MOVE_DOWN, new MovementStrategy(state, Direction.DOWN)],
			[Action.MOVE_UP, new MovementStrategy(state, Direction.UP)],
			[Action.ZOOM_OUT, new ZoomStrategy(rm, false)],
			[Action.ZOOM_IN, new ZoomStrategy(rm, true)],
			[Action.BOOST, new BoostStrategy(state)]
		]);

		this.lastScreenPosition = new Vector2();
		this.dragging = false;
		this.enabled = false;

		if(position !== null && quaternion !== null) {

			// Note: Default mode is first person.
			this.target.set(0, 0, -1).applyQuaternion(this.quaternion);
			this.lookAt(this.target);

			if(domElement !== null) {

				this.setEnabled();

			}

		}

	}

	/**
	 * Returns the DOM element.
	 *
	 * @return The DOM element.
	 */

	getDomElement(): HTMLElement {

		return this.domElement;

	}

	/**
	 * Sets the DOM element.
	 *
	 * @param domElement - The new DOM element.
	 * @return This instance.
	 */

	setDomElement(domElement: HTMLElement): SpatialControls {

		const enabled = this.enabled;

		if(domElement !== null) {

			if(enabled) {

				this.setEnabled(false);

			}

			this.domElement = domElement;
			this.setEnabled(enabled);

		}

		return this;

	}

	/**
	 * Returns the position.
	 *
	 * @return The position.
	 */

	getPosition(): Vector3 {

		return this.position;

	}

	/**
	 * Sets the position.
	 *
	 * @param x - The X-coordinate, or a new position vector.
	 * @param y - The Y-coordinate.
	 * @param z - The Z-coordinate.
	 * @return This instance.
	 */

	setPosition(x: number | Vector3, y?: number, z?: number): SpatialControls {

		if(x instanceof Vector3) {

			this.position = x;
			this.rotationManager.setPosition(x);
			this.translationManager.setPosition(x);

		} else {

			this.position.set(x, y, z);

		}

		return this.lookAt(this.target);

	}

	/**
	 * Returns the quaternion.
	 *
	 * @return The quaternion.
	 */

	getQuaternion(): Quaternion {

		return this.quaternion;

	}

	/**
	 * Sets the quaternion.
	 *
	 * @param quaternion - The new quaternion.
	 * @return This instance.
	 */

	setQuaternion(quaternion: Quaternion): SpatialControls {

		this.quaternion = quaternion;
		this.rotationManager.setQuaternion(quaternion);
		this.translationManager.setQuaternion(quaternion);

		if(this.settings.general.getMode() === ControlMode.FIRST_PERSON) {

			this.target.set(0, 0, -1).applyQuaternion(quaternion);

		}

		return this.lookAt(this.target);

	}

	/**
	 * Returns the target.
	 *
	 * @return The target.
	 */

	getTarget(): Vector3 {

		return this.target;

	}

	/**
	 * Sets the target.
	 *
	 * @param x - The X-coordinate, or a new target vector.
	 * @param y - The Y-coordinate.
	 * @param z - The Z-coordinate.
	 * @return This instance.
	 */

	setTarget(x: number | Vector3, y?: number, z?: number): SpatialControls {

		if(x instanceof Vector3) {

			this.target = x;
			this.rotationManager.setTarget(x);
			this.translationManager.setTarget(x);

		} else {

			this.target.set(x, y, z);

		}

		return this.lookAt(this.target);

	}

	/**
	 * Returns the current view direction.
	 *
	 * @param view - A vector to store the direction in.
	 * @return The normalized view direction.
	 */

	getViewDirection(view: Vector3): Vector3 {

		return this.rotationManager.getViewDirection(view);

	}

	/**
	 * Copies the given controls.
	 *
	 * @param controls - A controls instance.
	 * @return This instance.
	 */

	copy(controls: SpatialControls): SpatialControls {

		const p = this.position = controls.getPosition();
		const q = this.quaternion = controls.getQuaternion();
		const t = this.target = controls.getTarget();

		this.domElement = controls.getDomElement();
		this.settings.copy(controls.settings);
		this.rotationManager.setPosition(p).setQuaternion(q).setTarget(t);
		this.translationManager.setPosition(p).setQuaternion(q).setTarget(t);

		return this.lookAt(t);

	}

	/**
	 * Clones this instance.
	 *
	 * @return The cloned controls.
	 */

	clone(): SpatialControls {

		const clone = new SpatialControls();

		return clone.copy(this);

	}

	/**
	 * Moves to the given position.
	 *
	 * In third person mode, the target will be moved to the given location and
	 * the position will be adjusted accordingly.
	 *
	 * @param x - The X-coordinate, or a point.
	 * @param y - The Y-coordinate.
	 * @param z - The Z-coordinate.
	 * @return This instance.
	 */

	moveTo(x: number | Vector3, y?: number, z?: number): SpatialControls {

		if(x instanceof Vector3) {

			this.translationManager.moveTo(x);

		} else {

			this.translationManager.moveTo(v.set(x, y, z));

		}

		return this;

	}

	/**
	 * Looks at the given point.
	 *
	 * @param x - The X-coordinate, or a point.
	 * @param y - The Y-coordinate.
	 * @param z - The Z-coordinate.
	 * @return This instance.
	 */

	lookAt(x: number | Vector3, y?: number, z?: number): SpatialControls {

		if(x instanceof Vector3) {

			this.rotationManager.lookAt(x);

		} else {

			this.rotationManager.lookAt(v.set(x, y, z));

		}

		return this;

	}

	/**
	 * Locks or unlocks the pointer.
	 *
	 * @param locked - Whether the pointer should be locked.
	 */

	private setPointerLocked(locked = true): void {

		if(locked) {

			if(document.pointerLockElement !== this.domElement &&
				this.domElement.requestPointerLock !== undefined) {

				this.domElement.requestPointerLock();

			}

		} else if(document.exitPointerLock !== undefined) {

			document.exitPointerLock();

		}

	}

	/**
	 * Enables or disables the controls.
	 *
	 * @param enabled - Whether the controls should be enabled or disabled.
	 * @return This instance.
	 */

	setEnabled(enabled = true): SpatialControls {

		const domElement = this.domElement;

		this.translationManager.getMovementState().reset();

		if(enabled && !this.enabled) {

			document.addEventListener("pointerlockchange", this);
			document.addEventListener("visibilitychange", this);
			document.body.addEventListener("keyup", this);
			document.body.addEventListener("keydown", this);
			domElement.addEventListener("mousedown", this);
			domElement.addEventListener("mouseup", this);
			domElement.addEventListener("mouseleave", this);
			domElement.addEventListener("touchstart", this);
			domElement.addEventListener("touchend", this);
			domElement.addEventListener("wheel", this, { passive: true });

		} else if(!enabled && this.enabled) {

			document.removeEventListener("pointerlockchange", this);
			document.removeEventListener("visibilitychange", this);
			document.body.removeEventListener("keyup", this);
			document.body.removeEventListener("keydown", this);
			domElement.removeEventListener("mousedown", this);
			domElement.removeEventListener("mouseup", this);
			domElement.removeEventListener("mouseleave", this);
			domElement.removeEventListener("touchstart", this);
			domElement.removeEventListener("touchend", this);
			domElement.removeEventListener("wheel", this);
			domElement.removeEventListener("mousemove", this);
			domElement.removeEventListener("touchmove", this);

		}

		this.setPointerLocked(false);
		this.enabled = enabled;

		return this;

	}

	/**
	 * Handles pointer move events.
	 *
	 * @param event - A pointer event.
	 */

	private handlePointerMoveEvent(event: MouseEvent): void {

		const settings = this.settings;
		const rotation = settings.rotation;
		const pointerBehaviour = settings.pointer.getBehaviour();
		const pointerSensitivity = settings.pointer.getSensitivity();
		const rotationManager = this.rotationManager;
		const lastScreenPosition = this.lastScreenPosition;

		if(document.pointerLockElement === this.domElement) {

			if(pointerBehaviour === PointerBehaviour.LOCK || this.dragging) {

				rotationManager.adjustSpherical(
					event.movementX * pointerSensitivity * rotation.getSensitivityX(),
					event.movementY * pointerSensitivity * rotation.getSensitivityY()
				).updateQuaternion();

			}

		} else {

			// Compensate for inconsistent web APIs.
			const movementX = event.screenX - lastScreenPosition.x;
			const movementY = event.screenY - lastScreenPosition.y;

			lastScreenPosition.set(event.screenX, event.screenY);

			rotationManager.adjustSpherical(
				movementX * pointerSensitivity * rotation.getSensitivityX(),
				movementY * pointerSensitivity * rotation.getSensitivityY()
			).updateQuaternion();

		}

	}

	/**
	 * Handles touch move events.
	 *
	 * @param event - A touch event.
	 */

	private handleTouchMoveEvent(event: TouchEvent): void {

		const settings = this.settings;
		const rotation = settings.rotation;
		const pointerSensitivity = settings.pointer.getSensitivity();
		const rotationManager = this.rotationManager;
		const lastScreenPosition = this.lastScreenPosition;
		const touch = event.touches[0];

		// Compensate for inconsistent web APIs.
		const movementX = touch.screenX - lastScreenPosition.x;
		const movementY = touch.screenY - lastScreenPosition.y;

		lastScreenPosition.set(touch.screenX, touch.screenY);

		rotationManager.adjustSpherical(
			movementX * pointerSensitivity * rotation.getSensitivityX(),
			movementY * pointerSensitivity * rotation.getSensitivityY()
		).updateQuaternion();

	}

	/**
	 * Handles main pointer button events.
	 *
	 * @param event - A pointer event.
	 * @param pressed - Whether the pointer button has been pressed down.
	 */

	private handleMainPointerButton(event: PointerEvent, pressed: boolean): void {

		this.dragging = pressed;

		if(this.settings.pointer.getBehaviour() !== PointerBehaviour.DEFAULT) {

			this.setPointerLocked();

		} else {

			if(pressed) {

				this.lastScreenPosition.set(event.screenX, event.screenY);
				this.domElement.addEventListener("mousemove", this, { passive: true });

			} else {

				this.domElement.removeEventListener("mousemove", this);

			}

		}

	}

	/**
	 * Handles auxiliary pointer button events.
	 *
	 * @param event - A pointer event.
	 * @param pressed - Whether the pointer button has been pressed down.
	 */

	private handleAuxiliaryPointerButton(event: PointerEvent,
		pressed: boolean): void {}

	/**
	 * Handles secondary pointer button events.
	 *
	 * @param event - A pointer event.
	 * @param pressed - Whether the pointer button has been pressed down.
	 */

	private handleSecondaryPointerButton(event: PointerEvent,
		pressed: boolean): void {}

	/**
	 * Handles pointer events.
	 *
	 * @param event - A pointer event.
	 * @param pressed - Whether the pointer button has been pressed down.
	 */

	private handlePointerButtonEvent(event: PointerEvent,
		pressed: boolean): void {

		event.preventDefault();

		switch(event.button) {

			case PointerButton.MAIN:
				this.handleMainPointerButton(event, pressed);
				break;

			case PointerButton.AUXILIARY:
				this.handleAuxiliaryPointerButton(event, pressed);
				break;

			case PointerButton.SECONDARY:
				this.handleSecondaryPointerButton(event, pressed);
				break;

		}

	}

	/**
	 * Handles pointer leave events.
	 *
	 * @param event - A pointer event.
	 */

	private handlePointerLeaveEvent(event: PointerEvent): void {

		this.domElement.removeEventListener("mousemove", this);

	}

	/**
	 * Handles touch start and end events.
	 *
	 * @param event - A touch event.
	 * @param start - Whether the event is a touch start event.
	 */

	private handleTouchEvent(event: TouchEvent, start: boolean): void {

		const touch = event.touches[0];

		// Don't produce mouse events.
		event.preventDefault();

		if(start) {

			this.lastScreenPosition.set(touch.screenX, touch.screenY);
			this.domElement.addEventListener("touchmove", this, { passive: true });

		} else {

			this.domElement.removeEventListener("touchmove", this);

		}

	}

	/**
	 * Handles keyboard events.
	 *
	 * @param event - A keyboard event.
	 * @param pressed - Whether the key has been pressed down.
	 */

	private handleKeyboardEvent(event: KeyboardEvent, pressed: boolean): void {

		const keyBindings = this.settings.keyBindings;

		if(keyBindings.has(event.keyCode)) {

			event.preventDefault();
			this.strategies.get(keyBindings.get(event.keyCode)).execute(pressed);

		}

	}

	/**
	 * Handles wheel events.
	 *
	 * @param event - A wheel event.
	 */

	private handleWheelEvent(event: WheelEvent): void {

		this.rotationManager.zoom(Math.sign(event.deltaY));

	}

	/**
	 * Enables or disables controls based on the pointer lock state.
	 */

	private handlePointerLockEvent(): void {

		if(document.pointerLockElement === this.domElement) {

			this.domElement.addEventListener("mousemove", this, { passive: true });

		} else {

			this.domElement.removeEventListener("mousemove", this);

		}

	}

	/**
	 * Cancels active interactions on visibility loss.
	 */

	private handleVisibilityChangeEvent(): void {

		if(document.hidden) {

			this.translationManager.getMovementState().reset();
			this.domElement.removeEventListener("mousemove", this);
			this.domElement.removeEventListener("touchmove", this);

		}

	}

	/**
	 * Reacts to setting changes.
	 *
	 * @param event - An event.
	 */

	private onSettingsChanged(event: Event): void {

		const general = this.settings.general;

		if(general.getMode() !== general.getPreviousMode()) {

			if(general.getMode() === ControlMode.THIRD_PERSON) {

				// Switch to third person.
				v.copy(this.target);
				this.target.copy(this.position);
				this.position.sub(v);

			} else {

				// Switch to first person.
				this.position.copy(this.target);
				this.target.set(0, 0, -1).applyQuaternion(this.quaternion);

			}

		}

		this.rotationManager.updateSpherical().updatePosition().updateQuaternion();

	}

	handleEvent(event: Event): void {

		switch(event.type) {

			case "mousemove":
				this.handlePointerMoveEvent(event as PointerEvent);
				break;

			case "touchmove":
				this.handleTouchMoveEvent(event as TouchEvent);
				break;

			case "mousedown":
				this.handlePointerButtonEvent(event as PointerEvent, true);
				break;

			case "mouseup":
				this.handlePointerButtonEvent(event as PointerEvent, false);
				break;

			case "mouseleave":
				this.handlePointerLeaveEvent(event as PointerEvent);
				break;

			case "touchstart":
				this.handleTouchEvent(event as TouchEvent, true);
				break;

			case "touchend":
				this.handleTouchEvent(event as TouchEvent, false);
				break;

			case "keydown":
				this.handleKeyboardEvent(event as KeyboardEvent, true);
				break;

			case "keyup":
				this.handleKeyboardEvent(event as KeyboardEvent, false);
				break;

			case "wheel":
				this.handleWheelEvent(event as WheelEvent);
				break;

			case "pointerlockchange":
				this.handlePointerLockEvent();
				break;

			case "visibilitychange":
				this.handleVisibilityChangeEvent();
				break;

			case "change":
				this.onSettingsChanged(event);
				break;

		}

	}

	update(timestamp: number): void {

		this.rotationManager.update(timestamp);
		this.translationManager.update(timestamp);

	}

	dispose(): void {

		this.setEnabled(false);

	}

}
