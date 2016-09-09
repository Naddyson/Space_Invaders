;(function(){
	var Game = function(canvasId, nickname){

		var canvas = document.getElementById(canvasId);
		var screen = canvas.getContext('2d');
		var gameSize = {
			x: canvas.width,
			y: canvas.height
		};
		
		var gameOver = false;
		this.nickname = nickname;
		this.wave = 1;
		this.tickTimer = 1;
		this.score = 0;
		this.bodies = createInvaders(this).concat([new Player(this, gameSize)]);
		
		var self = this;
		var tick = function() {
			self.tickTimer++;
			self.update(gameSize);
			self.draw(screen,gameSize);
			self.setScore(self.score);
			if (self.tickTimer % 1200 == 0)
				self.bodies=spawnInvaders(self).concat(self.bodies);
			if (!self.gameOver){
				
				requestAnimationFrame(tick);
			}
			else {
				$(".gameOverWindow").show();
				var scoreOb = {
					'nickname': self.nickname,
					'score': self.score
				}
				
				$.ajax({
					type: 'POST',
					url: 'index.php',
					dataType: 'json',
					data: "param="+JSON.stringify(scoreOb),
					success: function(html){
						$(".high").remove();
						for (var i=0; i<16; i++){
							$("table").append("<tr class='high'><td width='40' align='center'>"+(i+1)+
								".</td><td width='260'>"+html[i]['username']
								+"</td><td width='70' align='right'>"+html[i]['score']
								+"</td></tr>");
						}
					}
				});
				
			}
		}
		tick();
	}
	var putHighscore = function(nickname,score){

	}
	Game.prototype = {
		

		update: function(gameSize){
			var bodies = this.bodies;
			var score = this.score;

			//метод ниже удаляет из игры объекты, стоклнувшиеся с друг другом
			//не понял, как переделать под прочность - запилил двойной цикл
			/*var notCollidingWithAnything = function(b1){
				return bodies.filter(function(b2){
					return colliding(b1,b2);

				}).length == 0;
					}
			};
				
			this.bodies = this.bodies.filter(notCollidingWithAnything);*/
			try{
			for (var i=0; i<this.bodies.length; i++)
				for (var j = 0; j < this.bodies.length; j++) {
					if (colliding(this.bodies[i],this.bodies[j])){
						this.bodies[i].strength = this.bodies[i].strength - 1;
						this.bodies[j].strength = this.bodies[j].strength - 1;
						if (this.bodies[i].strength <= 0 && this.bodies[j].strength <= 0){
							if (this.bodies[i] instanceof Invader && this.bodies[j].from=="Player") this.score++;
							if (this.bodies[j] instanceof Invader && this.bodies[i].from=="Player") this.score++;
							this.bodies.splice(i,1);
							this.bodies.splice(j-1, 1);

						} else {
							if (this.bodies[i].strength <=0){
								if (this.bodies[i] instanceof Invader && this.bodies[j].from=="Player") this.score++;
								this.bodies.splice(i,1);
							}
							else 
							if (this.bodies[j].strength <=0){
								if (this.bodies[j] instanceof Invader && this.bodies[i].from=="Player") this.score++;
								this.bodies.splice(j,1);
							}
						}
					}
				}
			}
			catch(e){console.log(e);
			}
			//удаляет не попавшие по цели пули
			
			for (var i=0; i<this.bodies.length; i++){
				this.bodies[i].update(gameSize);
				if(this.bodies[i].position.y < -150 || this.bodies[i].position.y > gameSize.y)
					this.bodies.splice(i,1);
			}
			
			
		},
		draw: function(screen, gameSize){
			clearCanvas(screen,gameSize);
			this.gameOver = true;
			
			for (var i=0; i<this.bodies.length; i++){
				if (this.bodies[i] instanceof Player) this.gameOver=false;
				drawRect(screen, this.bodies[i]);
			}
			screen.fillStyle = "pink";
			screen.fillRect(1,375,800,1);
		},
		addBody: function(body){
			this.bodies.push(body);
		},

		invadersBelow: function(invader){
			return this.bodies.filter(function(b){
				return b instanceof Invader &&
				b.position.y > invader.position.y &&
				b.position.x - invader.position.x < invader.size.width;
			}).length > 0;
		},
		setScore: function(score){
			var strScore = String(score);
			var strLength = strScore.length;
			if (strScore.length == 1) $(".four").attr("id", scoreToWord(score));
			if (strScore.length == 2) {
				$(".four").attr("id", scoreToWord(Number(strScore[1])));
				$(".three").attr("id", scoreToWord(Number(strScore[0])));
			}
			if (strScore.length == 3) {
				$(".four").attr("id", scoreToWord(Number(strScore[2])));
				$(".three").attr("id", scoreToWord(Number(strScore[1])));
				$(".two").attr("id", scoreToWord(Number(strScore[0])));
			}
			if (strScore.length == 4) {
				$(".four").attr("id", scoreToWord(Number(strScore[3])));
				$(".three").attr("id", scoreToWord(Number(strScore[2])));
				$(".two").attr("id", scoreToWord(Number(strScore[1])));
				$(".one").attr("id", scoreToWord(Number(strScore[0])));
			}
		}

	}

	var scoreToWord = function(score){
		switch (score) {
			case 0: return "zero";
			case 1: return "one";
			case 2: return "two";
			case 3: return "three";
			case 4: return "four";
			case 5: return "five";
			case 6: return "six";
			case 7: return "seven";
			case 8: return "eight";
			case 9: return "nine";
		}
	}
	var Player = function(game,gameSize){
		    this.strength =3;
			this.name = 'Player';
			this.game = game;
			this.bullets = 0;
			this.timer = 0;
			this.size = {width:16,height:16};
			this.position = {x: gameSize.x/2-this.size.width/2, y: gameSize.y-this.size.height*3};
			this.keyboarder = new keyboarder();
		}
	
	Player.prototype = {
		update: function(gameSize){
			if(this.keyboarder.isDown(this.keyboarder.keys.left))
				if (this.position.x>0)
					this.position.x-=2;
			if(this.keyboarder.isDown(this.keyboarder.keys.right))
				if (this.position.x<gameSize.x-this.size.width)
					this.position.x += 2;
			if(this.keyboarder.isDown(this.keyboarder.keys.up))
				if (this.position.y>gameSize.y/2+gameSize.y/8)
					this.position.y-=2;
			if(this.keyboarder.isDown(this.keyboarder.keys.down))
				if (this.position.y<gameSize.y-this.size.height)
					this.position.y += 2;
			//if(this.keyboarder.isDown(this.keyboarder.keys.space)){
				if (this.bullets<1){//количество пуль за раз
					var bullet = new Bullet({x:this.position.x+this.size.width/2-3/2, 
						y: this.position.y-4}, {x:0,y:-6}, "Player");
					this.game.addBody(bullet);
					this.bullets++;
				//}
			}
			this.timer++;
			if (this.timer % 24 == 0 ){
				this.bullets = 0;
			}
		} 
	}
	var Bullet = function(position,velocity,from){
			this.strength = 1;
			this.name = 'Bullet';
			this.from = from;
			this.size = {width:3,height:3};
			this.position = position;
			this.velocity = velocity;
		}
	Bullet.prototype = {
		update: function(){
			this.position.x += this.velocity.x;
			this.position.y += this.velocity.y;
			
			}
		}

		
	var Invader = function(game,position){
		this.strength = 1;
		this.name = 'Invader';
		this.game = game;
		this.bullets = 0;
		this.size = {width:22, height:16};
		this.position = position;
		this.patrolX = 0;
		this.speedX = 1;
		this.speedY = 0.1;
		this.timer = 0;
	}
	Invader.prototype = {
		update: function( ){
			if(this.patrolX<0 || this.patrolX >500){
				this.speedX= -this.speedX;
			}
			this.position.y += this.speedY;
			this.position.x += this.speedX;
			this.patrolX += this.speedX;
			
			if (Math.random() < (0.02 + 0.01*this.game.wave) && !this.game.invadersBelow(this) && this.position.y>0-this.size.height/2){
				var bullet = new Bullet({x:this.position.x+this.size.width/2-3/2, 
						y: this.position.y+this.size.height}, 
						{x:Math.random()-0.5,y:2},"Invader");
					this.game.addBody(bullet);
			}
		}
	}	
	


	var keyboarder = function(){
		var keyState = {};
		window.onkeydown = function(e){
			keyState[e.keyCode] = true;

		}
		window.onkeyup = function(e){
			keyState[e.keyCode] = false;
		}
		this.isDown = function(keyCode){
			return keyState[keyCode] === true;
		}
		this.keys = {left: 37, right: 39, up: 38, down:40, space: 32};
	}
	var drawRect = function(screen, body){
		if(body instanceof Player){
			var img = new Image();

			if (body.strength==3) img.src = "img/player1.jpg";
			if (body.strength==2) img.src = "img/player2.jpg";
			if (body.strength==1) img.src = "img/player3.jpg";
			screen.drawImage(img, body.position.x, body.position.y, body.size.width, body.size.height);
		}
		if(body instanceof Invader){
			var img = new Image();
			img.src = 'img/invader.jpg';
			screen.drawImage(img, body.position.x, body.position.y, body.size.width, body.size.height);
		} 
		if(body.name==='Bullet'){
			screen.fillStyle = 'red';
			screen.fillRect(body.position.x, body.position.y, body.size.width, body.size.height);
		}
		
	}

	var clearCanvas = function(screen,gameSize){
		screen.clearRect(0,0,gameSize.x,gameSize.y);
	}

	var createInvaders = function(game){
		var invaders = [];
		for (var i=0; i<24; i++){
			var x = 30 + (i%8)*30;
			var y = 30 + (i%3)*30;
			invaders.push(new Invader(game, {x:x, y:y}));
		}
		return invaders;
	}
	var spawnInvaders = function(game){
		var invaders = [];
		for (var i=0; i<24; i++){
			var x = 30 + (i%8)*30;
			var y = -90 + (i%3)*30;
			invaders.push(new Invader(game, {x:x, y:y}));
		}
		game.wave++;
		return invaders;
	}

	var colliding = function(b1,b2){
		try
		{var col = !(b1 == b2 || 
					b1.position.x + b1.size.width/2 < b2.position.x - b2.size.width/2 ||
					b1.position.y + b1.size.height/2 < b2.position.y - b2.size.height/2 ||
					b1.position.x - b1.size.width/2 > b2.position.x + b2.size.width/2 ||
					b1.position.y - b1.size.height/2 > b2.position.y + b2.size.height/2
					);}
		catch(e){
			return true;
		}
		return col;
	}
	/*var colliding = function(_id1,_id2){
		return !( 
 		(  (_id1.position.y+_id1.sizeY >= _id2.position.y) && (_id1.position.x+_id1.size.width >= _id2.position.x)  ) && 
  		(  (_id1.position.x < _id2.position.x+_id2.size.width) && (_id1.position.y < _id2.position.y+_id2.size.height)  ) 
        );
	}*/

	window.onload = function (){
		var nickname = "";
		$(".submit").click(function(){

			nickname = $("#nickname").val();
			if (nickname != ""){
				$(".nickname").hide();
				$(".startWindow").show();
				$("canvas").show();
				$(".score").show();
				$(".highscores").show();
				$("p").show();

				$.ajax({
					type: 'POST',
					url: 'index.php',
					dataType: 'json',
					data: "first="+nickname,
					success: function(html){
						
						for (var i=0; i<16; i++){
							$("table").append("<tr class='high'><td width='40' align='center'>"+(i+1)+
								".</td><td width='260'>"+html[i]['username']
								+"</td><td width='70' align='right'>"+html[i]['score']
								+"</td></tr>");
						}
					}
				});
			}
		});
		$(".start").click(function(){
			$(".startWindow").hide();
			$(".gameOverWindow").hide();
		 	var game = new Game("screen",nickname);
		 	$(".four").attr("id", "zero");
			$(".three").attr("id", "zero");
			$(".two").attr("id", "zero");
			$(".one").attr("id", "zero");
		})

	}
})();