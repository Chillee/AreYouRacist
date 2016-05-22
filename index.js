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
  var normal_total_demo = [0,0,0,0,0,0];
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
    }, {scope: 'user_friends,public_profile,user_posts'});
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
          // console.log(response.data[i].with_tags);
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

      // console.log(activity_demo);
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
    });
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
      console.log(friend_demo[full_name]);
      for (var j=0; j<friend_demo[full_name].length; j++){
        if (isNaN(friend_demo[full_name][j])){
          friend_demo[full_name][j]=0;
        }
        total_demo[j] += parseFloat(friend_demo[full_name][j])/100;
      }
    }
    var sum = 0;
    $.each(total_demo, function(){
      sum+=this;
    })
    for (var i=0; i<total_demo.length; i++){
      normal_total_demo[i] = total_demo[i]/sum;
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
          $('#login').html('<h1><font face="Times" color="black"><div id="titletext">How Racist Are You?</div><div id="secretHatedRace"></div></h1><div id="snarkyCommentary"></div><div id="chartContainer1" style="height: 300px; width: 350px; float: left;"></div><div id="chartContainer2" style="height: 300px; width: 350px; float: left;"></div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>');
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
      yValueFormatString: "#",
      legendText: "{indexLabel}",
      dataPoints: [
        {  y: total_demo[0], indexLabel: "White" },
        {  y: total_demo[2], indexLabel: "Asian" },
        {  y: total_demo[1], indexLabel: "Black" },
        {  y: total_demo[5], indexLabel: "Hispanics"},
        {  y: total_demo[3], indexLabel: "Pacific Islander" },
        {  y: total_demo[4], indexLabel: "Mixed"}
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
        {  y: activity_demo[0], indexLabel: "White" },
        {  y: activity_demo[2], indexLabel: "Asian" },
        {  y: activity_demo[1], indexLabel: "Black" },
        {  y: activity_demo[5], indexLabel: "Hispanics"},
        {  y: activity_demo[3], indexLabel: "Pacific Islander" },
        {  y: activity_demo[4], indexLabel: "Mixed"}
      ]
    }
    ]
  });
  chart.render();
      var mx = -999999999;
      var mx_idx = 0;
      var hate_race="";
      for (var i=0; i<6; i++){
        if (i==3 || i==4){
          continue;
        }
        if (mx < (normal_total_demo[i]/activity_demo[i])*(normal_total_demo[i]/activity_demo[i])){
          mx = (normal_total_demo[i]/activity_demo[i])*(normal_total_demo[i]/activity_demo[i]);
          mx_idx = i;
        }
      }
      var hate_text = {
        "White": " <p>Although you are living in a white dominated country, you still resent the numerous crimes against humanity that white people have performed. Good for you!</p>",
        "Black": " <p>Still, you epitomize everything that's wrong with America. This is why we need social justice.</p>",
        "Hispanic": " <p>Maybe we should build a wall around YOU to prevent your kind from dominating America.</p>",
        "Asian": "<p></p>"
      }
      if (mx_idx == 0){
        hate_race = "White";
      } else if (mx_idx==2){
        hate_race = "Asian";
      } else if (mx_idx==1){
        hate_race = "Black";
      } else if (mx_idx==5){
        hate_race = "Hispanic";
      }
      $('#secretHatedRace').text("You Secretly Hate: "+hate_race+" People");
      console.log(hate_text[hate_race]);

        if ((activity_demo[1] < .04 || activity_demo[5] < .06) && (normal_total_demo[1]/activity_demo[1] > 1.6 || normal_total_demo[5]/activity_demo[5] > 1.6) && (normal_total_demo[1] > .04 && norma_total_demo[5] > .07)){
          $('body').css('background', 'url(https://cdn.psychologytoday.com/sites/default/files/blogs/116001/2013/03/121216-119505.jpg)');
          $('#titletext').text('You Are: Racist (But Trying to Hide It)');
          $('#snarkyCommentary').html('<p>This blatant self-segregating behavior is unfortunate but lucky for you there are many ways to alleviate this disaster. Here are some helpful tips and tricks to help you on your way to being a happier, more fulfilled, more accepting and tolerant person.</p>'+
'<p>Please remember to ask every minority, "so, what are you?"" so you can demonstrate your interest in their culture.</p> '+
'<p>The centuries of oppression faced by your victims means that you have no right to unfollow minorities on Twitter even if they don\'t follow you back. See how it feels? </p>'+
'<p>Blanch in horror and disgust whenever an African-American refers to another African-American as a @#$!@. Condemn said African-Americans for their insensitivity.</p>'+
'<p>It is your duty to use your privilege to help the less fortunate. For example, think about how culturally appropriative it is for school cafeterias to serve banh mi made from ciabatta.</p>'+
'<p>Remember that if you don\'t like something, no one has the right to like it either, and remember to use your newfound and absolute moral superiority with discretion!</p>' + hate_text[hate_race]);
        } else if((normal_total_demo[1] < .05 || normal_total_demo[5] < .08)){
          $('body').css('background', 'url(http://media.breitbart.com/media/2015/10/DSC09510e-640x427.jpg)');
          $('#titletext').html('You Are: Hopelessly Racist');
          $('#snarkyCommentary').text('Check your privilege - you are so far gone that you are not worth saving. You are a lesser human being for your intolerance. Apologize for your existence and accept your dreadful fate of a life of misery and loneliness as you end up on the wrong side of history. Remember that you are worthless and that the world is a better place without you.<br>'+ hate_text[hate_race]);
        } else {
          $('body').css('background', 'url(http://thumbs.dreamstime.com/z/portrait-beautiful-adult-happy-woman-thumbs-up-sign-isolated-white-background-31744193.jpg)');
          $('#titletext').text('You Are: Not Racist');
          $('#snarkyCommentary').html('Congratulations! Your large group of token minority friends has cemented your status as NOT A RACIST. Your insipid social media interactions and pity likes serve the pretense and political purpose of friendship and allow you to feel comfortable defending, understanding, and advocating for the feelings of people in a group you are not a part of! Fight on!'+hate_text[hate_race]);
        }

        } else {
          FB.api(response.paging.next, handleFriends);
        }
      }
  }