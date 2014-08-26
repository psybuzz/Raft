// Setup.
var boxN = 2000;
for (var i = 0; i < boxN; i++) {
	$('body').append('<div class="box" style="background-color: salmon"></div>');
}

var content = document.getElementById('content');
var meter = document.getElementById('fpsMeter');
var maxMeter = document.getElementById('maxMeter');

var extraTimeRaft = new Raft({
	action: function (frame, fps, avgFps, maxFps){
		$('.box').each(function (){
			$(this).css('width', Math.random()*800);
		});

		meter.style.backgroundColor = 'seagreen';
	},

	inaction: function (frame, fps, avgFps, maxFps){
		meter.style.backgroundColor = 'lightseagreen';
	},

	always: function (frame, fps, avgFps, maxFps){
		content.innerText = frame;

		if (frame % 4 === 0){
			meter.innerText = 'FPS: ' + fps;
			meter.style.width = fps*3 + 'px';
		}
		if (frame % 10 === 0){
			maxMeter.innerText = 'Max: ' + maxFps + ' Avg: ' + avgFps;
		}
	}
});
extraTimeRaft.loop();

// Try commenting out the Raft object above, and instead calling the code below.
// Without Raft, changes in the DOM happen more frequently, but at the cost of lowered FPS.
// Scrolling, for example, is much choppier in this second example.

// $('.box').each(function (){
// 	$(this).css('width', Math.random()*800);
// });
