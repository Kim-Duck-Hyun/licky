var args = arguments[0],
	photoCol = args.collection;
	
$.sendBtn.addEventListener('click', function(e) {
	Ti.Media.takePicture();
});

$.closeBtn.addEventListener('click', function(e) {
	Ti.Media.hideCamera();
});


function getCurrentPosition(){
	// reverse geo
	Titanium.Geolocation.getCurrentPosition(function(e)
	{
		if (!e.success || e.error)
		{
			currentLocation.text = 'error: ' + JSON.stringify(e.error);
			Ti.API.info("Code translation: "+translateErrorCode(e.code));
			alert('error ' + JSON.stringify(e.error));
			return;
		}
	
		var longitude = e.coords.longitude;
		var latitude = e.coords.latitude;
		
		Titanium.Geolocation.reverseGeocoder(latitude,longitude,function(evt)
		{
			if (evt.success) {
				var places = evt.places;
				if (places && places.length) {
					$.geoLabel.text = places[0].address;
					// _.each(places,function(p){
						// $.geoLabel.text += p.address+'\n'; 
					// });
				} else {
					$.geoLabel.text = "No address found";
				}
				Ti.API.debug("reverse geolocation result = "+JSON.stringify(evt));
			}
			else {
				Ti.UI.createAlertDialog({
					title:'Reverse geo error',
					message:evt.error
				}).show();
				Ti.API.info("Code translation: "+translateErrorCode(e.code));
			}
		});	
	});	
}

$.contentFiled.addEventListener('postlayout', function(e) {
	$.contentFiled.removeEventListener('postlayout',arguments.callee);
	$.contentFiled.focus();
});

exports.showCamera = function(){
	if(OS_IOS){
		Ti.Media.hideCamera();
	}
	
	Ti.Media.showCamera({
		success : function(event) {
			
			Ti.API.info(event.media.width);
			Ti.API.info(event.media.height);
			var height = parseInt(640*event.media.height/event.media.width);
			$.capturedImage.height = height;
			$.capturedImage.top = -parseInt(height/4);
			$.capturedImage.image = event.media;
			
			$.captureLabel.text = $.contentFiled.value;
			photoCol.create({
				title : $.contentFiled.value,
				photo : $.capture.toImage(null),
				'photo_sync_sizes[]' : 'original'
			},{
				wait:true
			});
			
			Ti.Media.hideCamera();
			
			
		},
		cancel : function() {
		},
		error : function(error) {
			var message;
			if (error.code == Ti.Media.NO_CAMERA) {
				message = 'Device does not have video recording capabilities';
			} else {
				message = 'Unexpected error: ' + error.code;
			}
	
			Ti.UI.createAlertDialog({
				title : 'Camera',
				message : message
			}).show();
		},
		overlay : this.getView(),
		saveToPhotoGallery : false,
		allowEditing : false,
		showControls : false,
		animated : false,
		autohide : false,
		transform : Ti.UI.create2DMatrix().scale(1),
		mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
	});
	getCurrentPosition();
};
