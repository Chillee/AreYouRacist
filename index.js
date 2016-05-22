window.fbAsyncInit = function() {
    FB.init({
      appId      : '1138356476237925',
      xfbml      : true,
      version    : 'v2.6'
    });
  };
  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  var friend_names = [];
  var friend_demo = []
  var name_demo = []
  var total_demo = [0,0,0,0,0,0];
  var activity_log = [];
  var activity_demo = [0,0,0,0,0,0];
  var finished_async = 0;

  $('#facebookLogin').click(function(){
    FB.login(function(response){
      console.log(FB.getAuthResponse());
      if (response.authResponse){
        $('#login').html('<h1><font face="Times" color="black"><div id="snarkyLoadingMessage">Compiling your racism...</div></h1><div class="progress"><div class="progress-bar" id="progressbar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width:0%"></div>');
        setTimeout(function(){
          $.ajax({
          url: "names_16k.csv",
          async: false,
          success: function (csvd) {
            var data = $.csv.toArrays(csvd);
            for (var i=0; i<data.length; i++){
              name_demo[data[i][0]] = data[i].slice(1);
            }
          },
          dataType: "text",
          complete: getAllData
        });
        }, 50);
        
      }
    }, {scope: 'user_friends,public_profile,user_posts', auth_type: 'reauthenticate'});
  });
  function getAllData(){
    $('#progressbar').css('width', '33%');
    $('#snarkyLoadingMessage').text("The fact that you're taking this is a good sign - the first step is recognizing you have a problem!");
    FB.api("/me/invitable_friends?fields=name", handleFriends); 
    
    FB.api('me/feed/?fields=with_tags,from', function(response){
      for (var i=0; i<response.data.length; i++){
        if (response.data[i].from !== undefined){
          console.log(response.data[i].from);
          activity_log.push({
            name: response.data[i].from.name,
            type: "friend_from_post"
          })
        }
        if (response.data[i].with_tags !== undefined){
          console.log(response.data[i].with_tags);
          for (var j=0; j<response.data[i].with_tags.data.length; j++){
            activity_log.push({
              name: response.data[i].with_tags.data[j].name,
              type: "friend_tagged_with"
            })
          }
        }
        var getCommentData = function(response){
          for (var j=0; j<response.data.length; j++){
            activity_log.push({
              name: response.data[j].from.name,
              type: "friend_comment"
            });
          }
          if (response.data.length === 0){
            return;
          }
          if (response.paging.next !== undefined){
            FB.api(response.paging.next, getCommentData);
          } else {
            finished_async++;
          }
        }
        FB.api(response.data[i].id+'/comments', getCommentData);

        var getReactionData = function(response){
          for (var j=0; j<response.data.length; j++){
            activity_log.push({
              name: response.data[j].name,
              type: "friend_"+response.data[j].type
            });
          }
          if (response.data.length === 0){
            return;
          }
          if (response.paging.next !== undefined){
            FB.api(response.paging.next, getReactionData);
          } 
        }
        FB.api(response.data[i].id+'/reactions', getReactionData);
      }
    });
  }

  function getActivityData(activity_log){
    for (var i=0; i<activity_log.length; i++){
      var full_name = activity_log[i]['name'];
      var last_name = full_name.split(' ').slice(-1).join(' ').toUpperCase();
      var demo = name_demo[last_name];

      if (demo===undefined){
        continue;
      }
      for (var j=0; j<demo.length; j++){
        if (isNaN(demo[j])){
          demo[j] = 0;
        }
      }
      var type = activity_log[i]['type'];
      if (type=='friend_LIKE'){
        for (var j=0; j<activity_demo.length; j++){
          activity_demo[j]+=parseInt(demo[j])*1;
        }
      } else if(type=='friend_LOVE'){
        for (var j=0; j<activity_demo.length; j++){
          activity_demo[j]+=parseInt(demo[j])*2;
        }
      } else if(type=='friend_comment'){
        for (var j=0; j<activity_demo.length; j++){
          activity_demo[j]+=parseInt(demo[j])*2;
        }
      } else if(type=='friend_from_post'){
        for (var j=0; j<activity_demo.length; j++){
          activity_demo[j]+=parseInt(demo[j])*4;
        }
      } else if(type=='friend_tagged_with'){
        for (var j=0; j<activity_demo.length; j++){
          activity_demo[j]+=parseInt(demo[j])*4;
        }
      }
    }
    var sum = 0;
    $.each(activity_demo, function(){
      sum+=this;
    })
    for (var i=0; i<activity_demo.length; i++){
      activity_demo[i]/=sum;
    }
  }

  function getTotalDemographicData(friend_names, name_demo){
    for (var i=0; i<friend_names.length; i++){
      var full_name = friend_names[i]['name'];
      var last_name = full_name.split(' ').slice(-1).join(' ').toUpperCase();
      friend_names[i]['race_data']=name_demo[last_name];
      if (friend_names[i]['race_data']===undefined){
        continue;
      }
      friend_demo[full_name] = friend_names[i]['race_data'];
      for (var j=0; j<friend_demo[full_name].length; j++){
        if (isNaN(friend_demo[full_name][j])){
          friend_demo[full_name][j]=0;
        }
        total_demo[j] += parseFloat(friend_demo[full_name][j]);
      }
    }
    var sum = 0;
    $.each(total_demo, function(){
      sum+=this;
    })
    for (var i=0; i<total_demo.length; i++){
      total_demo[i]/=sum;
    }
  }
  Array.max = function( array ){
    return Math.max.apply( Math, array );
  };
  function handleFriends(response){
      if (response && !response.error) {
        for (var i=0; i<response.data.length; i++){
          friend_names.push(response.data[i]);
        }
        if (response.paging.next === undefined){
          $('#progressbar').css('width', '66%');
         $('#snarkyLoadingMessage').text("Pro tip: flights for mission trips to Botswana are cheapest in March. "); 
          getTotalDemographicData(friend_names, name_demo);
          getActivityData(activity_log);
          $('#login').html('<h1><font face="Times" color="black">How Racist Are You?</h1><div id="chartContainer1" style="height: 300px; width: 350px; float: left;"></div><div id="chartContainer2" style="height: 300px; width: 350px; float: left;"></div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br<p>Insert some explanation here</p>');
          $('#login').prop('id', 'result');
          var chart = new CanvasJS.Chart("chartContainer1",
  {
    theme: "theme2",
    title:{
      text: "Distribution of \"Friends\""
    },    
    data: [
    {       
      type: "pie",
      showInLegend: true,
      toolTipContent: "{y} - #percent %",
      yValueFormatString: "#0.#,,. Million",
      legendText: "{indexLabel}",
      dataPoints: [
        {  y: 4181563, indexLabel: "White" },
        {  y: 2175498, indexLabel: "Asian" },
        {  y: 3125844, indexLabel: "Black" },
        {  y: 1176121, indexLabel: "Hispanics"},
        {  y: 1727161, indexLabel: "Pacific Islander" },
        {  y: 4303364, indexLabel: "Mixed"}
      ]
    }
    ]
  });
  chart.render();
  var chart = new CanvasJS.Chart("chartContainer2",
  {
    theme: "theme2",
    title:{
      text: "Distribution of Actual Interactions"
    },    
    data: [
    {       
      type: "pie",
      showInLegend: true,
      toolTipContent: "{y} - #percent %",
      yValueFormatString: "#0.#,,. Million",
      legendText: "{indexLabel}",
      dataPoints: [
        {  y: 1181563, indexLabel: "White" },
        {  y: 2175498, indexLabel: "Asian" },
        {  y: 125844, indexLabel: "Black" },
        {  y: 176121, indexLabel: "Hispanics"},
        {  y: 727161, indexLabel: "Pacific Islander" },
        {  y: 1303364, indexLabel: "Mixed"}
      ]
    }
    ]
  });
  chart.render();

        } else {
          FB.api(response.paging.next, handleFriends);
        }
      }
  }