var Countdownr = (function($) {
	
	var countdownrRunning = false
	
	var countdownr = function(seconds) {
		$('#countdownr').html(seconds)
		if (seconds <= 0) {
			countdownrRunning = false
			console.log('Countdownr done')
		} else {
			setTimeout(countdownr, 1000, seconds - 1)
		}
	}

	return {
		startWithTime: function(seconds) {
			if (!countdownrRunning) {
				countdownr(seconds)
				countdownrRunning = true
			} else {
				console.log('Countdownr already running')
			}
		}
	}

})(jQuery)
