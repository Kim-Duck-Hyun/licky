var args = arguments[0] || {}, userModel = args.userModel;

//init extendEdges
// 원래 tss에서 지정하면 작동해야하는데 안되서 js에서 처리
$.profile.extendEdges = [];

if (userModel) {
	// 다른 사람 프로필
	Ti.API.info("[profile.js] another user");
} else if(AG.isLogIn()){
	Ti.API.info("[profile.js] loggedInUser");
	userModel = AG.loggedInUser;
} else{
	//에러 방지 차원에서 빈모델 생성
	userModel = Alloy.createModel('user');
}


// title & label 변경
var isMe = userModel.get('id') == AG.loggedInUser.get('id');
$.profile.title = isMe?L('me'):userModel.get('first_name');
$.foodRowLabel.text = isMe?L('myLicks'):String.format(L('someoneLicks'),userModel.get('first_name'));
$.likeRowLabel.text = isMe?L('myLikes'):String.format(L('someoneLikes'),userModel.get('first_name'));
$.contactUsBtn.visible = isMe;
if(!isMe){
	$.menuTable.deleteRow($.likeRow);
	$.menuTable.height = 44;
}

$.getView().addEventListener('focus', function(e) {
	$.setProperties();
});

$.mainContent.addEventListener('scroll', _.throttle(function(e){
	// $.profileBannerImage.setHeight( 212.5 - e.y);
	$.profileBannerImage.animate({
		duration: 15,
		height: 212.5 - e.y});
	// $.controlBar.animate({
		// duration: 10,
		// top: 182.5 - e.y});
}, 10));



$.menuTable.addEventListener('click', function(e) {
	switch(e.row.id){
		case 'lickyRow':
			AG.utils.openController(AG.mainTabGroup.activeTab,
				 "someonePostList", {
				userModel : userModel
			});
		break;
		case 'likeRow':
			AG.utils.openController(AG.mainTabGroup.activeTab,
				"someonePostList", {
				userModel : userModel,
				likedPostOnly : true
			});
		break;
	}
});



$.settingDialog.addEventListener('click', _.throttle(function(e) {
	if (e.index === 0) {
		// AG.settings.get('cloudSessionId') ? AG.loginController.logout() : AG.loginController.requireLogin();
		AG.loginController.logout(function(e){
			AG.mainTabGroup.setActiveTab(0);
		});
	}
},1000));
$.profileSettingBtn.addEventListener('click', function(e) {
	$.settingDialog.show();
});

$.contactUsBtn.addEventListener('click', function(e) {
	
	var phoneInfo = {
		platform : Ti.Platform.model,
		osVersion : Ti.Platform.version,
		locale : Ti.Platform.locale,
		appId : Ti.App.id,
		appVersion : Ti.App.version
	};
	
	var bodyString='<br/><br/> <strong>* '+L('userEnvironment') + '*</strong><br/>';
	_.each(phoneInfo,function(value,key){
		bodyString+=String.format("<strong>%s</strong> : %s<br/>",key,value);
	});
	var emailDialog = Ti.UI.createEmailDialog({
		subject : L('mailSubject'),
		toRecipients : ['sup@licky.co'],
		messageBody : bodyString,
		barColor : '#3498db',
		html : true
	});
	
	if(!emailDialog.isSupported()){
		alert(L('notSupportEmail'));
		Ti.UI.Clipboard.setText('sup@licky.co');
	} else {
		emailDialog.open();
	}	
});


//로그인 상태 변경시
AG.settings.on('change:cloudSessionId', loginChangeHandler);

//로그인된 사용자 모델(local에 저장한 properties model) 변경시
AG.loggedInUser.on('change', function(model) {

});

// $.loginBtn.addEventListener('click', function(e) {
	// AG.settings.get('cloudSessionId') ? AG.loginController.logout() : AG.loginController.requireLogin();
// });
function loginChangeHandler(changedValue) {
	if(changedValue && !userModel.get('id')){
		userModel = AG.loggedInUser;
	}
	
	// 최초에 이미 로그인 되어 있을 경우에 대한 처리
	if (AG.isLogIn() || userModel.get('id')) {
		// $.resetClass($.loginBtn, 'afterLogin');
		$.menuTable.setVisible(true);
		$.name.setVisible(true);
		
	} else {
		// $.resetClass($.loginBtn, 'beforeLogin');
		$.menuTable.setVisible(false);
		$.name.setVisible(false);
		
		$.profileBannerImage.setImage(null);
		$.profileImage.setImage( $.profileImage.getDefaultImage() );
	}
	
	isMe = userModel.get('id') == AG.loggedInUser.get('id');
	$.wireForBtnImg.visible = isMe;
	$.profileSettingBtn.visible = isMe;
}
loginChangeHandler();

exports.setProperties = function() {
	if (!userModel.get('id')) {
		return;
	}

	var fb_id = userModel.get('external_accounts')[0].external_id;
	$.name.text = userModel.get('first_name');
	$.profileImage.image = String.format("https://graph.facebook.com/%s/picture?width=%d&height=%d", fb_id, 140, 140);
	AG.facebook.requestWithGraphPath(fb_id, {
		fields : 'cover'
	}, "GET", function(e) {
		if (e.success) {
			var resultObj = JSON.parse(e.result);
			if(resultObj.cover){
				$.profileBannerImage.image = resultObj.cover.source;
			}
		}
	});
	
	// 해당 사용자가 작성한 post 수 확인 
	// 주의!!!!!! loggedIn User로 인해 get('id') 함수로 id를 가져와야함)
	if(userModel.get('id')){  // !!!
		var postCol = Alloy.createCollection('post');
		postCol.fetch({
			data : {
				per_page : 1,
				where :{
					user_id: {'$in' : [userModel.get('id')]} // !!!
				}
			},
			success : function(col){
				$.foodRowCount.text = col.meta.total_results;
			}
		});
		
		var likeCol = Alloy.createCollection('like');
		likeCol.fetch({
			data : {
				user_id : userModel.get('id'),
				likeable_type : 'Post',
				per_page : 1
			},
			success : function(col){
				$.likeRowCount.text = col.meta.total_results;
				// Ti.API.info(col.meta.total_results);
			}
		});
	}
};

$.profileImage.addEventListener('click', function(){
	$.profileViewOptionDialog.show();
});
$.profileViewOptionDialog.addEventListener('click', function(e) {
	var fb_id = userModel.get('external_accounts')[0].external_id;
	switch(this.options[e.index]){
		case L('viewPicture'):
			// scrollView.add(imagev);
			// $.profile.add(scrollView);
			
			AG.utils.openController(AG.mainTabGroup.activeTab, 'imageWindow', {
				imageUrl: String.format("https://graph.facebook.com/%s/picture?width=%d&height=%d", fb_id, 640, 640)
			}, {animated:false});
		break;
		case L('viewProfileOnFacebook'):
			if(Ti.Platform.canOpenURL("fb://profile/" + fb_id)){
				Ti.Platform.openURL("fb://profile/" + fb_id);
			}else{
				Ti.Platform.openURL("http://facebook.com/" + fb_id);
			}
		break;
		
		case L('cancel'):
		default :
		break;
	}
});

$.name.addEventListener('click', function(e){
	// AG.notifyController.setBadge(10);
});