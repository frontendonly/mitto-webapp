import { EventEmitter } from "@jeli/core";
export var httpInProgress = new EventEmitter();
export var noop = () => {};