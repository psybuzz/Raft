/**
 * RAFT.js
 * Version 0.0.1
 * (c) 2014
 */

/**
 * The Raft class defines objects that handle actions whenever the frames per second dives below
 * a particular threshold.
 * 
 * @param {Object} options The raft configuration.
 *      @param {boolean} useAverage Whether or not to use the average frames per second as the
 *           threshold versus just using the current. Defaults to true.
 *      @param {number} fpsBufferLength The number of frames to keep in the buffer when calculating
 *           the average fps. Defaults to 3.
 *      @param {number} loopTimeout The timeout to wait in between calls to the looping function.
 *           Defaults to 0.
 *      @param {number} targetFps The target frames per second. Defaults to 60.5.
 *      @param {number} calibrationPeriod The number of milliseconds to wait in between automatic
 *           calibration periods. If undefined, it will not automatically calibrate the target FPS.
 *      @param {Function} action The callback to be executed repeatedly. It will be provided with
 *           the frame count and fps information. Defaults to an empty function.
 *      @param {Function} inaction If provided, the callback to be executed when the condition is
 *           not met.
 *      @param {Function} always If provided, the callback to be executed no matter what.
 */
var Raft = function (options){
	var useAverage = options.useAverage || true;
	var fpsBufferLength = this.fpsBufferLength = options.fpsBufferLength || 3;
	var loopTimeout = this.loopTimeout = options.loopTimeout || 0;
	var targetFps = this.targetFps = options.targetFps || 60.5;
	var calibrationPeriod = options.calibrationPeriod || null;
	var action = this.action = options.action || function(){};
	var hasInaction = typeof options.inaction === 'function';
	var hasAlways = typeof options.always === 'function';

	// The frame count.
	this.frames_ = 0;

	// The last recorded time.
	this.lastTime = Date.now();

	// Frames per second and its max, min, and average equivalents.
	this.fps = null;
	this.maxFps = 0;
	this.minFps = Infinity;
	this.avgFps = null;

	// Initialize an array holding the last X fps values.
	this.fpsBuffer = new Array(fpsBufferLength);
	for (var i=0; i<fpsBufferLength;){
		this.fpsBuffer[i++] = 0;
	}
	this.bufferIndex = 0;

	// Determine whether we are updating the target FPS (in which case we should not call the
	// action) or not.
	var updatingTargetFps = false;

	// Set auto-calibrate if needed.
	if (calibrationPeriod !== null) this.calibrateTargetFps();

	// Cancelable items.
	this.timeout_ = null;
	this.request_ = null;
 
	/**
	 * Runs an iteration of the loop, calculating FPS, conditionally calling the action, and
	 * repeating.
	 */
	this.loop = function (){
		this.frames_++;

		// Calculate the FPS using the current and last recorded time.
		time = this.now();
		fps = Math.floor(1000/(time - this.lastTime));
		this.lastTime = time;

		// Update the max FPS.
		if (fps > this.maxFps){
			this.maxFps = fps;
		}

		// Update the FPS buffer to better predict average FPS.
		this.fpsBuffer[this.bufferIndex] = fps;
		this.bufferIndex = (this.bufferIndex + 1) % fpsBufferLength;
		var bufferSum = 0;
		for (var i = 0; i < fpsBufferLength; i++) {
			bufferSum += this.fpsBuffer[i];
		}
		this.avgFps = Math.floor(bufferSum / fpsBufferLength);

		// Call the appropriate callbacks.
		if (!updatingTargetFps && ((useAverage && bufferSum > this.targetFps * fpsBufferLength) ||
				(!useAverage && fps > this.targetFps))){
			action(this.frames_, fps, this.avgFps, this.maxFps);
		} else if (hasInaction){
			options.inaction(this.frames_, fps, this.avgFps, this.maxFps);
		}
		if (hasAlways) options.always(this.frames_, fps, this.avgFps, this.maxFps);

		// If calibrating the target FPS, call the appropriate method.
		if (updatingTargetFps) this.updateCalibrationBuffer_(fps);

		// Request another frame to iterate after a certain timeout.
		this.timeout = setTimeout(function (){
			this.request = requestAnimationFrame(this.loop);
		}.bind(this), loopTimeout);
	}.bind(this);

	/**
	 * Cancels the currently running loop, if possible.
	 */
	this.cancel = function (){
		if (window){
			window.clearTimeout(this.timeout);
			window.cancelAnimationFrame(this.request);
		}
	};

	/**
	 * Calibrates the target FPS by running and reading from several frames.
	 * 
	 * @param {number} frameCount The number of frames to use in the test. Defaults to 60.
	 */
	this.calibrateTargetFps = function (frameCount){
		this.frameCount = frameCount || 60;
		this.calibrateTargetBuffer_ = [];
		updatingTargetFps = true;

		// Call the next auto-calibration step after the defined period.
		if (calibrationPeriod !== null){
			setTimeout(function(){
				this.calibrateTargetFps();
			}.bind(this), calibrationPeriod);
		}
	};

	/**
	 * Updates the calibration buffer with a new FPS entry. This is used internally during target
	 * FPS calibration.
	 * 
	 * @param  {number} fps The new FPS reading to be recorded.
	 */
	this.updateCalibrationBuffer_ = function (fps){
		this.calibrateTargetBuffer_.push(fps);
		this.frameCount--;

		if (this.frameCount < 1){
			updatingTargetFps = false;

			var bufferSum = 0;
			for (var i = 0; i < this.calibrateTargetBuffer_.length; i++) {
				bufferSum += this.calibrateTargetBuffer_[i];
			}

			// Set the new target FPS to be the average FPS reading with offset.
			this.targetFps = (bufferSum / this.calibrateTargetBuffer_.length) + 0.5;
			console.log('Calibrated Raft to use target FPS:', this.targetFps);
		}
	};
};

// The timing function that returns the current time.
if (performance.now){
	Raft.prototype.now = function(){return performance.now()};
} else {
	Raft.prototype.now = function(){return Date.now()};
}

// Expose the Raft class as a module if possible.
if (typeof module !== 'undefined'){
	module.exports = Raft;
} else if (typeof exports !== 'undefined'){
	exports.Raft = Raft;
} else {
	this.Raft = Raft;
}