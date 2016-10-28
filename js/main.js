$(function() {
	var car = $('.car');
	var obj = $('.obj');
	var path = $('.path');
	var coin = $('.coin');
	var blast = $('.blast');
	var night = $('.night');
	var plane = $('.plane');
	var bossObj = $('.boss');
	var spikes = $('.spikes');
	var shield = $('.shield');
	var bullet = $('.bullet');
	var lights = $('.headlights');
	var bloodBar = $('.boss_blood');
	var shootx3 = $('.top_3_shoots');
	var car_shield = $('.car_shield');
	var objExplode = $('.obj .explode');
	var distraction = $('.distraction');
	var bloodFill = $('.boss_blood .fill');
	var doc = $(document);
	var win = $(window);
	var level = 1;
	var leftPosition = {
		1: 0,
		2: 25,
		3: 50,
		4: 75,
	};
	var speed = {
		1: 2300,
		2: 2000,
		3: 1700,
		4: 1500,
		5: 1400,
		6: 1300,
		7: 1200,
		'special': 3000
	}
	var bgSpeed = {
		1: 800,
		2: 700,
		3: 600,
		4: 500,
		5: 400,
		6: 300,
		7: 250
	};
	var boss = {
		'bloodState': 100,
		1: {decrease: 10}, // Blood 10
		2: {decrease: 6.66} // Blood 15
	}
	var coins = 0;
	var score = 0;
	var bullets = 0;
	var carColumn = 3;
	var pauseCount = 0;
	var gameOn = false;
	var freezed = false;
	var isNight = false;
	var shielded = false;
	var gameEnded = false;
	var objRunning = false;
	var gameStarted = false;
	var blastInited = false;
	var bossInited = false;
	var dayInterval = 47500;
	var pathWidth = win.width();
	var pathHeight = win.height();
	var carTopPosition = car.offset().top;
	var carLeftPosition = leftPosition[carColumn];
	var obj;
	var objColumn;
	var currentBoss;
	var objTopPosition;
	var spikesTopPosition;
	var bossShootTopPosition;
	var initCoin;
	var initNight;
	var initPlane;
	var initObject;
	var initShield;
	var initBullet;
	var initSpikes;
	var initBossShoot;
	var initDistraction;
	var initLevelAndScore;

	function randomRange(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	};

	function moveCar(direction) {
		if (direction == 'left') {
			if (carColumn != 1) {
				carColumn = carColumn - 1;
				carLeftPosition = leftPosition[carColumn];
			}
		}

		if (direction == 'right') {
			if (carColumn != 4) {
				carColumn = carColumn + 1;
				carLeftPosition = leftPosition[carColumn];
			}
		}

		if (!blastInited) {
			blast.velocity('stop').velocity({'left' : carLeftPosition + '%'}, 100);
		}

		$('.car').velocity('stop').velocity({'left' : carLeftPosition + '%'}, 100);
	};

	function initControls() {
		doc.on('keydown.control', function(e) {
			var key = e.which || e.keyCode || e.charCode;

			if (key == 37) {
				moveCar('left');
			}
			if (key == 39) {
				moveCar('right');
			}
			if (key == 40 && !freezed && !shielded) { // Down
				if (coins >= 15) {
					coins -= 3;
					freezed = true;

					function disableFreezeTime() {
						freezed = false;
						obj.velocity('stop').velocity({opacity: 0}, {
							duration: 150,
							complete: function() {
								clearInterval(initObject);
								createObject();
							}
						});
					};

					$('.money span').text(coins);

					obj.velocity('stop').velocity({opacity: 0}, {
						duration: 150,
						complete: function() {
							clearInterval(initObject);
							countDown(15000, 'Freeze Time!', disableFreezeTime);
							createObject();
						}
					});
				}
			}
			if (key == 38 && !blastInited && bullets > 0) { // Up
				bullets -= 1;
				shoot();
			}
		});
	};

	function levelAndScore() {
		function update(number, func) {
			level = number;

			$('.level span').text(level);

			if (func && typeof func == 'function') {
				func;
			}
		};

		initLevelAndScore = setInterval(function() {
			if (gameOn) {
				$('.score span').text((score += 10));
				
				if (score == 10)    update(1);
				if (score == 1000)  update(2);
				if (score == 2000)  update(3, createDistraction());
				if (score == 3000)  update(4, createShieldBonus());
				if (score == 5000)  update(5);
				if (score == 8000)  update(6, createBoss(1));
				if (score == 20000) update(7, createBoss(2));
			}
		}, 100);
	};

	function countDown(time, text, callback) {
		$('.special_left .text').text(text);
		$('.special_left').velocity({opacity: 1}, 300);
		$('.special_left .fill')
		.velocity({width: '100%'}, 0)
		.velocity('reverse', {
			duration: time,
			complete: function() {
				$('.special_left').velocity({opacity: 0}, 150);

				if (callback && typeof callback == 'function') {
					callback();
				}
			}
		});
	};

	function animateBackground() {
		path
		.velocity({backgroundPositionY: [620, 0]}, {
			delay: 0,
			easing: 'linear',
			duration: bgSpeed[level],
			complete: animateBackground
		});
	};

	function randomSkin() {
		$('.obj').attr('class', 'obj _' + (Math.floor(Math.random() * 7) + 1));
	};

	function createObject() {
		objColumn = Math.floor(Math.random() * 4) + 1;
		var objSpeed = freezed ? speed['special'] : speed[level] - 300;
		var objInterval = freezed ? speed['special'] + 300 : speed[level];

		initObject = setInterval(function() {
			objRunning = true;

			obj
			.velocity('stop')
			.css({'left': leftPosition[objColumn] + '%', 'top': - 130, 'opacity': 1})
			.velocity({top: pathHeight}, {
				easing: 'linear',
				duration: objSpeed,
				begin: function() {
					if (level >= 5 && !bossInited) {
						initSpikes = setTimeout(function() {
							createSpikes(objSpeed);
						}, objSpeed);
					}
				},
				progress: function() {
					objTopPosition = obj.offset().top + 130;

					if (objColumn == carColumn && !blastInited && objTopPosition >= carTopPosition && ((pathHeight - objTopPosition) + 130) > 60) {
						if (shielded) {
							coins += 1;
							destroyObj();
							$('.money span').text(coins);
						} else {
							endGame();							
						}
					}
				},
				complete: function() {
					clearInterval(initObject);
					objRunning = false;
					obj.css({'top': -130});
					randomSkin();
					createObject();
				}
			});
		}, objInterval);
	};

	function destroyObj(callback) {
		objExplode.css({'opacity': 1});

		obj
		.velocity('stop')
		.velocity({opacity: 0}, {
			duration: 150,
			complete: function() {
				clearInterval(initObject);
				objExplode.css({'opacity': 0});
				randomSkin();
				createObject();
				if (callback && typeof callback == 'function') {
					callback();
				}
			}
		});
	};

	function createCoinBonus() {
		var coinColumn = Math.floor(Math.random() * 4) + 1;
		var coinLeftPosition = leftPosition[coinColumn];

		function reset() {
			clearInterval(initCoin);
			createCoinBonus();
		};

		initCoin = setInterval(function() {
			coin
			.velocity('stop')
			.css({'left': coinLeftPosition + '%', 'top': -130, 'width': '25%', 'height': 130, 'opacity': 1})
			.velocity({top: pathHeight}, {
				easing: 'linear',
				duration: speed[level],
				progress: function() {
					if (coinColumn == carColumn && (coin.offset().top + 130) >= carTopPosition) {
						coins += 1;

						coin
						.velocity('stop')
						.velocity({'top': 23, 'left': '115%', 'opacity': 0.5, 'width': 20, 'height': 20}, {
							easing: 'ease-in',
							duration: 450,
							complete: function() {
								coin.css({'opacity': 0});
								reset();
							}
						});

						$('.money span').text(coins);
					}
				},
				complete: reset
			});
		}, speed[level] + 500);
	};

	function createBulletBonus() {
		function reset() {
			clearInterval(initBullet);
			createBulletBonus();
		};

		initBullet = setInterval(function() {
			var bulletColumn = Math.floor(Math.random() * 4) + 1;
			var bulletLeftPosition = leftPosition[bulletColumn];

			bullet
			.velocity('stop')
			.css({'left': bulletLeftPosition + '%', 'top': -130, 'width': '25%', 'height': 130, 'opacity': 1})
			.velocity({top: pathHeight}, {
				easing: 'linear',
				duration: speed[level],
				progress: function() {
					if (bulletColumn == carColumn && (bullet.offset().top + 130) >= carTopPosition) {
						bullets += 1;

						if (bullets > 0) {
							$('.bullets').addClass('some');
						} else {
							$('.bullets').removeClass('some');
						}

						bullet
						.velocity('stop')
						.velocity({'top': 58, 'left': '115%', 'opacity': 0.5, 'width': 20, 'height': 20}, {
							easing: 'ease-in',
							duration: 450,
							complete: function() {
								bullet.css({'opacity': 0});
								reset();
							}
						});

						$('.bullets span').text(bullets);
					}
				},
				complete: reset
			});
		}, randomRange(5000, 10000));
	};

	function createShieldBonus() {
		function disableShield() {
			car_shield.velocity({opacity: 0}, {
				duration: 150,
				complete: function() {
					shielded = false;
				}
			});

			if (!bossInited) {
				createShieldBonus();
			}
		};

		initShield = setInterval(function() {
			var shieldColumn = Math.floor(Math.random() * 4) + 1;
			var shieldLeftPosition = leftPosition[shieldColumn];

			shield
			.velocity('stop')
			.css({'left': shieldLeftPosition + '%', 'top': - 130, 'opacity': 1})
			.velocity({top: pathHeight}, {
				easing: 'linear',
				duration: speed[level],
				progress: function() {
					if (shieldColumn == carColumn && !freezed && (shield.offset().top + 130) >= carTopPosition) {
						shielded = true;
						clearInterval(initShield);
						shield.velocity('stop').css({'opacity': 0});
						car_shield.velocity({opacity: 1}, 150);
						countDown(8000, 'Shielded!', disableShield);
					}
				},
				complete: function() {
					clearInterval(initShield);
					createShieldBonus();
				}
			});
		}, randomRange(15000, 20000));
	};

	function createDistraction() {
		var distractionInterval = randomRange((speed[level] + 1000), (speed[level] + 8000));

		initDistraction = setInterval(function() {
			var distractionColumn = Math.floor(Math.random() * 4) + 1;
			var distractionLeftPosition = leftPosition[distractionColumn];

			distraction
			.velocity('stop')
			.css({'top': -130, 'opacity': 1})
			.velocity({'left': distractionLeftPosition + '%', 'top': pathHeight}, {
				easing: 'linear',
				duration: 1000,
				complete: function() {
					clearInterval(initDistraction);
					createDistraction();
				}
			});
		}, distractionInterval);
	};

	function createAirPlane() {
		initPlane = setInterval(function() {
			plane
			.velocity('stop')
			.css({'left': -1700, 'opacity': 1})
			.velocity({left: pathWidth + 700}, {
				easing: 'linear',
				duration: 1500,
				complete: function() {
					clearInterval(initPlane);
					createAirPlane();
				}
			});
		}, randomRange(9000, 25000));
	};

	function shoot() {
		blastInited = true;
		var blastColumn = carColumn;

		function reset() {
			blastInited = false;
			blast.css({'bottom': 0, 'left': carLeftPosition + '%'}).css({opacity: 1});
		};

		if (bullets > 0) {
			$('.bullets').addClass('some');
		} else {
			$('.bullets').removeClass('some');
		}

		blast
		.velocity('stop')
		.css({'left': carLeftPosition + '%'})
		.velocity({bottom: pathHeight}, {
			easing: 'linear',
			duration: 600,
			begin: function() {
				if (bossInited){
					bossBlood(600);
					$('.boss .explode').css({'left': -(100 - carLeftPosition) + '%'});
				}
			},
			progress: function() {
				if (bossInited && blast.offset().top <= 130) {
					blast.velocity('stop').css({'opacity': 0});
					$('.boss .explode').velocity({opacity: 1}, 150).velocity({opacity: 0}, 150);
					reset();

					if (boss.bloodState < 0.5) {
						bossInited = false;
						levelAndScore();
						clearInterval(initBossShoot);

						$('.boss_blood, .boss, .top_3_shoots')
						.velocity('stop')
						.velocity({opacity: 0}, {
							duration: 150,
							complete: function() {
								boss.bloodState = 100;
								shootx3.css({'top': -80});
								bloodFill.css({'width': '100%'});
								bossObj.css({'top': -130}).removeClass('_' + currentBoss);
								createObject();
								createCoinBonus();
								createDistraction();
								createShieldBonus();
							}
						});
					}
				} else if (!bossInited && objRunning && blastColumn == objColumn && blast.offset().top <= objTopPosition) {
					blast.velocity('stop').css({'opacity': 0});
					destroyObj(reset());
				}				
			},
			complete: reset
		});

		$('.bullets span').text(bullets);
	};

	function toggleDayNight() {
		initNight = setInterval(function() {
			isNight = !isNight;
			dayInterval = isNight ? 11500 : 47500;

			night.velocity({opacity: isNight ? 1 : 0}, {
				duration: 2500,
				complete: function() {
					lights.css({'opacity': isNight ? 1 : 0});
				}
			});

			$('.cloud_left').velocity({left: isNight ? 0 : '-50%', opacity: isNight ? 1 : 0}, 2500);
			$('.cloud_right').velocity({right: isNight ? 0 : '-50%', opacity: isNight ? 1 : 0}, 2500);			

			clearInterval(initNight);
			toggleDayNight();
		}, dayInterval);
	};

	function createSpikes(speed) {
		var freeColumn = randomRange(1, 5);
		var bgPosition = (4 - freeColumn) * 100;

		spikes
		.velocity('stop')
		.css({'top': -80, 'opacity': 1,'background-position-x': -bgPosition})
		.velocity({'top': pathHeight}, {
			easing: 'linear',
			duration: speed,
			progress: function() {
				spikesTopPosition = spikes.offset().top + 80;

				if (!shielded && carColumn != freeColumn && spikesTopPosition >= carTopPosition && ((pathHeight - spikesTopPosition) + 80) > 90) {
					endGame();
				}
			}
		});
	};

	function createBoss(bosslevel) {
		currentBoss = bosslevel;

		clearInterval(initCoin);
		clearInterval(initObject);
		clearInterval(initShield);
		clearInterval(initDistraction);
		clearInterval(initLevelAndScore);

		$('.obj, .coin, .shield, .distraction')
		.velocity('stop')
		.velocity({opacity: 0}, {
			duration: 150,
			complete: function() {
				bossObj
				.css({'opacity': 1})
				.addClass('_' + currentBoss)
				.velocity({top: 0}, {
					duration: 800,
					complete: function() {
						bossInited = true;
						shootx3.css({'top': 30});
						bloodBar.css({'opacity': 1});
						bossShoot();
					}
				});
			}
		});
	};

	function bossBlood(interval) {
		boss.bloodState -= boss[currentBoss].decrease;

		if (boss.bloodState > 0.5) {
			setTimeout(function() {
				bloodFill.velocity({'width': boss.bloodState + '%'}, 200);
			}, interval);
		}
	};

	function bossShoot() {
		initBossShoot = setInterval(function() {
			var freeColumn = randomRange(1, 5);
			var bgPosition = (4 - freeColumn) * 100;

			shootx3
			.velocity('stop')
			.css({'top': 0, 'opacity': 1,'background-position-x': -bgPosition})
			.velocity({'top': pathHeight}, {
				easing: 'linear',
				duration: 1300,
				progress: function() {
					bossShootTopPosition = shootx3.offset().top + 80;

					if (!shielded && carColumn != freeColumn && bossShootTopPosition >= carTopPosition && ((pathHeight - bossShootTopPosition) + 80) > 90) {
						endGame();
					}
				}
			});
		}, 1300);
	};

	function refreshAnimation() {
		// Some animations glitch when inited for the first time so
		// we do them in the loading game state to avoid the glitches during the game
		objExplode.css({'opacity': 1}).css({'opacity': 0});
		night.velocity({opacity: 1}, 1000);
		plane.velocity({left: pathWidth + 700}, 1000);
		$('.cloud_left').velocity({left: 0, opacity: 1}, 1000);
		$('.cloud_right').velocity({right: 0, opacity: 1}, {
			duration: 1000,
			complete: function() {
				$('.plane, .night, .cloud_left, .cloud_right').attr('style', '');
			}
		});
	};

	refreshAnimation();

	function startObjects() {
		createObject();
		createBulletBonus();
		createCoinBonus();
	};

	function startGame() {
		gameOn = true;

		levelAndScore();
		initControls();
		animateBackground();
		toggleDayNight();
		createAirPlane();
	};

	function pauseGame() {
		gameOn = false;

		clearTimeout(initSpikes);
		clearInterval(initObject);
		clearInterval(initCoin);
		clearInterval(initPlane);
		clearInterval(initDistraction);
		clearInterval(initBullet);
		clearInterval(initNight);
		clearInterval(initShield);
		clearInterval(initBossShoot);
		clearInterval(initLevelAndScore);

		$('.path, .obj, .shield, .coin, .bullet, .spikes, .plane, .distraction, .special_left .fill, .cloud_left, .cloud_right, .top_3_shoots').velocity('stop');

		doc.off('keydown.control');
	};

	function endGame() {
		gameEnded = true;

		pauseGame();

		$('.car .explode').css({'opacity': 1});
		$('.over').velocity({opacity: 1}, 600);

		if (isNight) {
			$('.night, .cloud_left, .cloud_right, .headlights').velocity({opacity: 0}, 600);
		}

		if (score > $.cookie('best_score')) {
			$('.best_box span').text(score);
			$.cookie('best_score', score, { expires: 365, path: '/' });
		} else {
			$('.best_box span').text($.cookie('best_score'));
		}

		$('.score_box span').text(score);

		doc.on('keydown.restart', function(e) {
			var key = e.which || e.keyCode || e.charCode;

			if (key == 13) {
				doc.off('keydown.restart');

				level = 1;
				coins = 0;
				score = 0;
				bullets = 0;
				pauseCount = 0;
				boss.bloodState = 100;
				gameOn = true;
				freezed = false;
				shielded = false;
				gameEnded = false;
				bossInited = false;

				plane.css({'left': -700});
				shootx3.css({'top': -80});
				spikes.css({'top': -80});
				coin.css({'width': '25%', 'height': 130, 'opacity': 1});

				$('.money span').text(coins);
				$('.level span').text(level);
				$('.bullets').removeClass('some').find('span').text(bullets);
				$('.obj, .coin, .bullet, .distraction, .boss').css({'top': -130});
				$('.over, .car_shield').velocity('stop').css({'opacity': 0});
				$('.explode, .special_left, .distraction').css({'opacity': 0});
				$('.special_left .fill').css({'width': '0%'});

				startGame();
				startObjects();
			}
		});
	};

	function loadResources(images) {
		var done = 0;
		var count = images.length;

		var loaded = 0;
		var percent = 100 / count;

		$(images).each(function() {
			
			$('<img>').attr('src', 'images/' + this).on('load.resources', function() {
				done++;
				loaded += percent;

				$('.loader .fill').velocity('stop').velocity({width: loaded + '%'}, 150);

				if (done === count) {
					$('.loading_box').velocity({'opacity': 0}, {
						duration: 300,
						complete: function() {
							$('body').addClass('loaded');
							
							$('.start_legend').velocity({opacity: 1}, {
								duration: 300,
								complete: function() {
									function initGame() {
										gameStarted = true;
										doc.off('keydown.start');
										$('.start_box').velocity({'opacity': 0}, 300).off('click.startbtn');
										startGame();
										startObjects();
									};

									$('.start_btn').on('click.startbtn', function() {
										initGame();
									});

									doc.on('keydown.start', function(e) {
										var key = e.which || e.keyCode || e.charCode;

										if (key == 32) {
											initGame();
										}
									});
								}
							});
						}
					});
				}
			});
		});
	};

	$('<img>').attr('src', 'images/loading_bg.jpg').on('load.first', function() {
		$('.load_bg').velocity({opacity: 1}, {
			duration: 300,
			complete: function() {
				loadResources([
					'logo.png',
					'arrow_left.png',
					'arrow_right.png',
					'arrow_up.png',
					'arrow_down.png',
					'enter_btn.png',
					'start_btn.png',
					'bg.jpg',
					'logo.png',
					'blast.png',
					'bullet.png',
					'cloud_left.png',
					'cloud_right.png',
					'coin.png',
					'crash_bg.jpg',
					'distraction.png',
					'explode.png',
					'headlights.png',
					'plane.png',
					'racer.png',
					'road.jpg',
					'shield.png',
					'shield_bonus.png',
					'obj_green.png',
					'obj_yellow.png',
					'obj_purple.png',
					'obj_orange.png',
					'obj_grey.png',
					'obj_blue.png',
					'obj_black.png',
					'top_3_shoots.png',
					'boss_1.png',
					'road_spike.png'
				]);
			}
		});
	});

	$('.car, .blast').css({'left': carLeftPosition + '%'});

	path.css({'margin-left': -((2000 - pathWidth) / 2)});

	win.on('blur.pausegame', function() {
		if (!gameEnded && gameStarted) {
			pauseGame();
		}
	}).on('focus.resumegame', function() {
		if (!gameEnded && gameStarted) {
			pauseCount += 1;

			if (pauseCount >= 5) {
				endGame();
				return;
			}

			gameOn = true;
			freezed = false;
			shielded = false;

			plane.css({'left': -700});
			$('.special_left, .explode, .car_shield').css({'opacity': 0});
			$('.special_left .fill').css({'width': '0%'});
			$('.obj, .coin, .bullet, .distraction').css({'top': -130});

			startGame();

			if (bossInited) {
				shootx3.css({'top': 30});
				bossShoot();
			} else {
				startObjects();
			}
		}
	}).on('resize.updatepos', function() {
		var updateOnResize = setInterval(function() {
			clearInterval(updateOnResize);
			pathWidth = win.width();
			pathHeight = win.height();
			carTopPosition = car.offset().top;	
		}, 100);
	});

	if (!$.cookie('best_score')) {
		$.cookie('best_score', 0, { expires: 365, path: '/' });
	}
});