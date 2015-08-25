// Generated by CoffeeScript 1.4.0
(function() {
  ' \nA program to let the user play sixty-six and schnapsen against the computer.\n\nTo do: Make the computer a little smarter. ';

  var Card, ComputerAI, Deck, Game, Location, Table, ai, cardLedWins, cardPath, compareCards, computer, computerCard, computerHaul, computerLead, deck, drawCards, endRound, game, isLegal, isMarriage, lowRank, nextRound, player, playerCard, playerHaul, playerWins, randElement, shuffle, suitNumber, suitString, table, talon, trumpCard, valuePoints, valueRank,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    _this = this;

  if (schnapsenMode) {
    lowRank = 'J';
  } else {
    lowRank = '9';
  }

  cardPath = 'images/cards/';

  suitNumber = {
    C: 3,
    D: 0,
    H: 2,
    S: 1
  };

  suitString = {
    C: '&clubs;',
    D: '<span style="color:red">&diams;</span>',
    H: '<span style="color:red">&hearts;</span>',
    S: '&spades;'
  };

  valueRank = {
    9: 9,
    10: 13,
    J: 10,
    Q: 11,
    K: 12,
    A: 14
  };

  valuePoints = {
    9: 0,
    10: 10,
    J: 2,
    Q: 3,
    K: 4,
    A: 11
  };

  randElement = function(array) {
    return array[Math.floor(Math.random() * array.length)];
  };

  ComputerAI = (function() {

    function ComputerAI() {
      this.bestFollow = __bind(this.bestFollow, this);
      this.baseCardValues = {
        9: 0,
        10: 10,
        J: 2,
        Q: 3,
        K: 4,
        A: 11
      };
      this.trumpValueBonus = 6;
      this.marriageBonus = 10;
      this.aggressive = false;
    }

    ComputerAI.prototype.cardValue = function(card) {
      var value;
      value = this.baseCardValues[card.value];
      if (card.suit === game.trumpSuit) {
        value += this.trumpValueBonus;
      }
      if (isMarriage(card.id[0], card.id[1], computer) && (!game.deckClosed || schnapsenMode)) {
        value += Math.max(this.marriageBonus - game.round, 0);
      }
      return value;
    };

    ComputerAI.prototype.cardTracker = function(id) {
      var card, _ref, _ref1, _ref2;
      card = deck.find(id);
      if (((_ref = card.location) === 'talon' || _ref === 'player') && !((_ref1 = card.suit, __indexOf.call(game.marriages, _ref1) >= 0) && ((_ref2 = card.value) === 'K' || _ref2 === 'Q')) && !talon.isEmpty()) {
        return 'unknown';
      } else {
        return location;
      }
    };

    ComputerAI.prototype.unaccountedCards = function() {
      var card, _i, _len, _ref, _results;
      _ref = deck.cards;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        if (this.cardTracker(card.id) === 'unknown') {
          _results.push(card);
        }
      }
      return _results;
    };

    ComputerAI.prototype.beatsAll = function(computerCard, otherCards) {
      var card, wins;
      wins = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = otherCards.length; _i < _len; _i++) {
          card = otherCards[_i];
          _results.push(cardLedWins(computerCard, card));
        }
        return _results;
      })();
      return wins.reduce(function(x, y) {
        return x && y;
      });
    };

    ComputerAI.prototype.certainWin = function(computerCard) {
      var card, possibleCards, suitMatches;
      possibleCards = this.unaccountedCards().concat(player.getCards());
      if (game.deckClosed) {
        if (player.hasSuit(computerCard.suit)) {
          suitMatches = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = possibleCards.length; _i < _len; _i++) {
              card = possibleCards[_i];
              if (card.suit === computerCard.suit) {
                _results.push(card);
              }
            }
            return _results;
          })();
          return this.beatsAll(computerCard, suitMatches);
        } else {
          return !player.hasSuit(game.trumpSuit);
        }
      } else {
        return this.beatsAll(computerCard, possibleCards);
      }
    };

    ComputerAI.prototype.topCards = function() {
      var card, hand, other, otherCards;
      otherCards = this.unaccountedCards().concat(player.getCards());
      hand = computer.getCards();
      return (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = hand.length; _i < _len; _i++) {
          card = hand[_i];
          if (card.rank > Math.max.apply(Math, ((function() {
            var _j, _len1, _results1;
            _results1 = [];
            for (_j = 0, _len1 = otherCards.length; _j < _len1; _j++) {
              other = otherCards[_j];
              if (other.suit === card.suit) {
                _results1.push(other.rank);
              }
            }
            return _results1;
          })()))) {
            _results.push(card);
          }
        }
        return _results;
      })();
    };

    ComputerAI.prototype.bestLead = function() {
      var card, certainWinners, likelyPoints, marriageCards, nontrumpOptions, nontrumpWinners, options, topTrumps, toppers, trumpMarriageCards;
      options = computer.getCards();
      nontrumpOptions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = options.length; _i < _len; _i++) {
          card = options[_i];
          if (!card.isTrump()) {
            _results.push(card);
          }
        }
        return _results;
      })();
      certainWinners = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = options.length; _i < _len; _i++) {
          card = options[_i];
          if (this.certainWin(card)) {
            _results.push(card);
          }
        }
        return _results;
      }).call(this);
      nontrumpWinners = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = certainWinners.length; _i < _len; _i++) {
          card = certainWinners[_i];
          if (!card.isTrump()) {
            _results.push(card);
          }
        }
        return _results;
      })();
      marriageCards = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = options.length; _i < _len; _i++) {
          card = options[_i];
          if (isMarriage(card.value, card.suit, computer)) {
            _results.push(card);
          }
        }
        return _results;
      })();
      trumpMarriageCards = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = marriageCards.length; _i < _len; _i++) {
          card = marriageCards[_i];
          if (card.suit === game.trumpSuit) {
            _results.push(card);
          }
        }
        return _results;
      })();
      if (game.playerPoints > 45 || game.computerPoints > 45) {
        this.aggressive = true;
      } else {
        this.aggressive = false;
      }
      toppers = this.topCards();
      if (toppers.length > 0) {
        likelyPoints = ((function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = toppers.length; _i < _len; _i++) {
            card = toppers[_i];
            _results.push(card.points);
          }
          return _results;
        })()).reduce(function(a, b) {
          return a + b;
        }) + game.computerPoints;
      } else {
        likelyPoints = 0;
      }
      if (marriageCards.length > 0 && schnapsenMode) {
        likelyPoints += 10;
      }
      if (trumpMarriageCards.length > 0 && schnapsenMode) {
        likelyPoints += 10;
      }
      topTrumps = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = toppers.length; _i < _len; _i++) {
          card = toppers[_i];
          if (card.isTrump()) {
            _results.push(card);
          }
        }
        return _results;
      })();
      if (((likelyPoints > 55 && topTrumps.length > 1) || (likelyPoints > 65 && topTrumps.length > 0)) && !game.deckClosed) {
        game.computerClose();
      }
      if (nontrumpWinners.length > 0) {
        return randElement(nontrumpWinners).computerPlay();
      } else if (certainWinners.length > 0 && this.aggressive) {
        if (schnapsenMode || (!schnapsenMode && (game.deckClosed || marriageCards.length === 0))) {
          return certainWinners[0].computerPlay();
        } else {
          if (trumpMarriageCards.length > 0) {
            return trumpMarriageCards[0].computerPlay();
          } else {
            return marriageCards[0].computerPlay();
          }
        }
      } else if (marriageCards.length > 0 && (!game.deckClosed || schnapsenMode)) {
        if (trumpMarriageCards.length > 0) {
          return trumpMarriageCards[0].computerPlay();
        } else {
          return marriageCards[0].computerPlay();
        }
      } else if (nontrumpOptions.length > 0) {
        return randElement(nontrumpOptions).computerPlay();
      } else {
        return randElement(options).computerPlay();
      }
    };

    ComputerAI.prototype.netValue = function(card, playersCard) {
      if (cardLedWins(playersCard, card)) {
        return -card.points - playersCard.points - this.cardValue(card);
      } else {
        return +card.points + playersCard.points - this.cardValue(card);
      }
    };

    ComputerAI.prototype.worstCard = function(options) {
      var _this = this;
      options.sort(function(a, b) {
        return _this.cardValue(a) - _this.cardValue(b);
      });
      return options[0];
    };

    ComputerAI.prototype.bestValue = function(options, playersCard) {
      var _this = this;
      options.sort(function(a, b) {
        return _this.netValue(b, playersCard) - _this.netValue(a, playersCard);
      });
      return options[0];
    };

    ComputerAI.prototype.bestFollow = function() {
      var card, legalOptions, options, playersCard, winningOptions;
      options = computer.getCards();
      playersCard = playerCard.select();
      if (game.playerPoints > 45 || game.computerPoints > 45) {
        this.aggressive = true;
      } else {
        this.aggressive = false;
      }
      legalOptions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = options.length; _i < _len; _i++) {
          card = options[_i];
          if (isLegal(playersCard, card, options)) {
            _results.push(card);
          }
        }
        return _results;
      })();
      winningOptions = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = legalOptions.length; _i < _len; _i++) {
          card = legalOptions[_i];
          if (!cardLedWins(playersCard, card)) {
            _results.push(card);
          }
        }
        return _results;
      })();
      if (this.aggressive && winningOptions.length > 0) {
        return winningOptions[0].computerPlay();
      } else {
        return this.bestValue(legalOptions, playersCard).computerPlay();
      }
    };

    return ComputerAI;

  })();

  Card = (function() {

    function Card(value, suit) {
      this.swap = __bind(this.swap, this);

      this.computerTakes = __bind(this.computerTakes, this);

      this.playerTakes = __bind(this.playerTakes, this);

      this.computerPlay = __bind(this.computerPlay, this);

      this.playCard = __bind(this.playCard, this);

      this.cardAction = __bind(this.cardAction, this);
      this.suit = suit;
      this.value = value;
      this.rank = valueRank[this.value];
      this.points = valuePoints[this.value];
      this.id = this.value + this.suit;
      this.isTrump = function() {
        return this.suit === game.trumpSuit;
      };
      this.trueValue = function() {
        return valuePoints[this.value] + 10 * this.isTrump();
      };
      this.toString = function() {
        return this.value + suitString[this.suit];
      };
      this.front = "<img src='" + cardPath + this.id + ".png'></img>";
      this.back = "<img src='" + cardPath + "back.png'></img>";
      this.turnedUp = false;
      this.html = document.createElement("div");
      this.html.innerHTML = this.back;
      this.html.style.zIndex = 10;
      this.html.style.left = "50px";
      this.html.style.top = "50px";
      this.toNumber = function() {
        return 16 * suitNumber[this.suit] + valueRank[this.value];
      };
      this.location = 'talon';
      this.html.addEventListener("click", this.cardAction);
    }

    Card.prototype.cardAction = function() {
      switch (this.location) {
        case "talon":
          return game.playerClose();
        case "player":
          return this.playCard();
        case "trumpCard":
          return this.swap();
        case "playerHaul":
          return game.showHaul();
      }
    };

    Card.prototype.moveTo = function(x, y, z) {
      if (z == null) {
        z = 10;
      }
      this.html.style.left = x + "px";
      this.html.style.top = y + "px";
      return this.html.style.zIndex = z;
    };

    Card.prototype.turnUp = function() {
      this.html.innerHTML = this.front;
      return this.faceUp = true;
    };

    Card.prototype.turnDown = function() {
      this.html.innerHTML = this.back;
      return this.faceUp = false;
    };

    Card.prototype.playCard = function() {
      var gameOver, hand;
      if (playerCard.isEmpty()) {
        hand = player.getCards();
        if (game.playerLeads || isLegal(computerCard.select(), this, hand)) {
          playerCard.placeUp(this);
          if (game.playerLeads) {
            if (isMarriage(this.value, this.suit, player) && (schnapsenMode || !game.deckClosed)) {
              game.marriages += this.suit;
              game.playerMarriages += suitString[this.suit];
              if (this.suit === game.trumpSuit) {
                game.playerProvisional += 40;
              } else {
                game.playerProvisional += 20;
              }
              game.score();
              gameOver = game.checkWinner();
            }
            if (!gameOver) {
              ai.bestFollow();
            }
          }
          if (!gameOver) {
            return setTimeout(endRound, 1200);
          }
        } else {
          return alert("Now that the stack is closed, you must follow suit! You must also win the trick if you can.");
        }
      }
    };

    Card.prototype.computerPlay = function() {
      var hand;
      hand = computer.getCards();
      computerCard.placeUp(this);
      if (!game.playerLeads) {
        if (isMarriage(this.value, this.suit, computer) && (schnapsenMode || !game.deckClosed)) {
          game.marriages += this.suit;
          game.computerMarriages += suitString[this.suit];
          if (this.suit === game.trumpSuit) {
            game.computerProvisional += 40;
            alert('Royal marriage!');
          } else {
            game.computerProvisional += 20;
            alert('Marriage!');
          }
          game.score();
          return game.checkWinner();
        }
      }
    };

    Card.prototype.playerTakes = function() {
      playerHaul.stack(this);
      return game.playerPoints += this.points;
    };

    Card.prototype.computerTakes = function() {
      computerHaul.stack(this);
      return game.computerPoints += this.points;
    };

    Card.prototype.swap = function() {
      var newTrump;
      if (player.hasCard(lowRank + game.trumpSuit) && game.playerLeads) {
        player.placeUp(this);
        this.html.style.transform = "rotate(0deg)";
        this.html.style['-webkit-transform'] = "rotate(0deg)";
        newTrump = deck.find(lowRank + game.trumpSuit);
        trumpCard.placeUp(newTrump);
        newTrump.html.style.transform = "rotate(90deg)";
        newTrump.html.style['-webkit-transform'] = "rotate(90deg)";
        return player.display();
      }
    };

    Card.prototype.reset = function() {
      this.turnDown();
      this.location = 'talon';
      this.html.style.transform = 'rotate(0deg)';
      this.html.style['-webkit-transform'] = "rotate(0deg)";
      return this.moveTo(50, 50, 10);
    };

    return Card;

  })();

  Location = (function() {

    function Location(name, x, y, z, visible) {
      this.name = name;
      this.x = x;
      this.y = y;
      this.z = z;
      this.visible = visible;
    }

    Location.prototype.getCards = function() {
      var card, _i, _len, _ref, _results;
      _ref = deck.cards;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        if (card.location === this.name) {
          _results.push(card);
        }
      }
      return _results;
    };

    Location.prototype.getSuits = function() {
      var card, _i, _len, _ref, _results;
      _ref = deck.cards;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        if (card.location === this.name) {
          _results.push(card.suit);
        }
      }
      return _results;
    };

    Location.prototype.select = function() {
      return this.getCards().pop();
    };

    Location.prototype.hasSuit = function(suit) {
      var card;
      return __indexOf.call((function() {
        var _i, _len, _ref, _results;
        _ref = this.getCards();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          _results.push(card.suit);
        }
        return _results;
      }).call(this), suit) >= 0;
    };

    Location.prototype.hasCard = function(id) {
      var card;
      return __indexOf.call((function() {
        var _i, _len, _ref, _results;
        _ref = this.getCards();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          _results.push(card.id);
        }
        return _results;
      }).call(this), id) >= 0;
    };

    Location.prototype.isEmpty = function() {
      return this.getCards().length === 0;
    };

    Location.prototype.stack = function(newCard) {
      var height;
      height = this.getCards().length;
      if (this.visible) {
        newCard.moveTo(this.x + 15 * height, this.y, this.z + height);
        newCard.turnUp();
      } else {
        newCard.moveTo(this.x - 2 * height, this.y, this.z + height);
        newCard.turnDown();
      }
      return newCard.location = this.name;
    };

    Location.prototype.placeUp = function(newCard) {
      newCard.turnUp();
      newCard.location = this.name;
      return newCard.moveTo(this.x, this.y, this.z);
    };

    Location.prototype.placeDown = function(newCard) {
      newCard.turnDown();
      newCard.location = this.name;
      return newCard.moveTo(this.x, this.y, this.z);
    };

    Location.prototype.display = function() {
      var card, hand, i, _i, _len, _results;
      hand = this.getCards();
      hand.sort(compareCards);
      _results = [];
      for (i = _i = 0, _len = hand.length; _i < _len; i = ++_i) {
        card = hand[i];
        _results.push(card.moveTo(this.x + 100 * i, this.y, this.z));
      }
      return _results;
    };

    return Location;

  })();

  Game = (function() {

    function Game() {
      this.startNext = __bind(this.startNext, this);

      this.checkWinner = __bind(this.checkWinner, this);

      this.computerClose = __bind(this.computerClose, this);

      this.playerClose = __bind(this.playerClose, this);
      this.computerPoints = 0;
      this.playerPoints = 0;
      this.computerProvisional = 0;
      this.playerProvisional = 0;
      this.computerGamepoints = 0;
      this.playerGamepoints = 0;
      this.marriages = '';
      this.computerMarriages = '';
      this.playerMarriages = '';
      this.trumpSuit = '';
      this.playerLeads = true;
      this.deckClosed = false;
      this.deckCloser = '';
      this.nonCloserPoints = 0;
      this.round = 1;
      this.gameNumber = 1;
    }

    Game.prototype.initialize = function() {
      var card, i, special, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _m, _n, _o, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
      deck.shuffle();
      if (schnapsenMode) {
        _ref = deck.cards.slice(15, 20);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          player.placeUp(card);
        }
      } else {
        _ref1 = deck.cards.slice(18, 25);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          card = _ref1[_j];
          player.placeUp(card);
        }
      }
      player.display();
      if (schnapsenMode) {
        _ref2 = deck.cards.slice(10, 15);
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          card = _ref2[_k];
          computer.placeDown(card);
        }
      } else {
        _ref3 = deck.cards.slice(12, 18);
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          card = _ref3[_l];
          computer.placeDown(card);
        }
      }
      if (schnapsenMode) {
        special = deck.cards[9];
      } else {
        special = deck.cards[11];
      }
      trumpCard.placeUp(special);
      special.html.style.transform = "rotate(90deg)";
      special.html.style['-webkit-transform'] = "rotate(90deg)";
      this.trumpSuit = special.suit;
      if (schnapsenMode) {
        _ref4 = deck.cards.slice(0, 9);
        for (_m = 0, _len4 = _ref4.length; _m < _len4; _m++) {
          card = _ref4[_m];
          card.location = 'talon';
        }
      } else {
        _ref5 = deck.cards.slice(0, 11);
        for (_n = 0, _len5 = _ref5.length; _n < _len5; _n++) {
          card = _ref5[_n];
          card.location = 'talon';
        }
      }
      _ref6 = talon.getCards();
      for (i = _o = 0, _len6 = _ref6.length; _o < _len6; i = ++_o) {
        card = _ref6[i];
        card.moveTo(talon.x - 2 * i, talon.y, talon.z + i);
      }
      return this.score();
    };

    Game.prototype.playerDraw = function(location) {
      var card;
      card = location.select();
      player.placeUp(card);
      return player.display();
    };

    Game.prototype.computerDraw = function(location) {
      var card;
      card = location.select();
      return computer.placeDown(card);
    };

    Game.prototype.playerClose = function() {
      if (this.playerLeads) {
        trumpCard.getCards()[0].turnDown();
        this.deckClosed = true;
        this.deckCloser = 'player';
        return this.nonCloserPoints = Math.max(this.computerPoints, !computerHaul.isEmpty());
      }
    };

    Game.prototype.computerClose = function() {
      alert("I'm closing the stack.");
      trumpCard.getCards()[0].turnDown();
      this.deckClosed = true;
      this.deckCloser = 'computer';
      return this.nonCloserPoints = Math.max(this.playerPoints, !playerHaul.isEmpty());
    };

    Game.prototype.score = function() {
      if (!playerHaul.isEmpty()) {
        this.playerPoints += this.playerProvisional;
        this.playerProvisional = 0;
      }
      if (!computerHaul.isEmpty()) {
        this.computerPoints += this.computerProvisional;
        this.computerProvisional = 0;
      }
      return document.getElementById("scorebar").innerHTML = "<p>You: " + this.playerPoints + " points. " + this.playerMarriages + " &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp; Trump: <span style='font-size:22px;'>" + suitString[this.trumpSuit] + "</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Computer: " + this.computerPoints + " points. " + this.computerMarriages;
    };

    Game.prototype.checkWinner = function(autowinner) {
      var gameOver;
      if (autowinner == null) {
        autowinner = 'none';
      }
      gameOver = false;
      this.score();
      if (this.deckCloser.length > 0) {
        if (this.playerPoints > 65 || this.computerPoints > 65) {
          gameOver = true;
          if (this.playerPoints > 65) {
            if (this.deckCloser === 'player') {
              this.playerLeads = false;
              if (!schnapsenMode) {
                this.nonCloserPoints = Math.max(this.computerPoints, !computerHaul.isEmpty());
              }
              if (this.nonCloserPoints === 0) {
                this.announceWinner('player', 3);
              }
              if (this.nonCloserPoints > 0 && this.nonCloserPoints < 33) {
                this.announceWinner('player', 2);
              }
              if (this.nonCloserPoints >= 33) {
                this.announceWinner('player', 1);
              }
            } else {
              this.playerLeads = false;
              if (this.nonCloserPoints > 0) {
                this.announceWinner('player', 2, 'Unsuccessful fold. ');
              } else {
                this.announceWinner('player', 3, 'Unsuccessful fold. ');
              }
            }
          } else {
            if (this.deckCloser === 'computer') {
              this.playerLeads = true;
              if (!schnapsenMode) {
                this.nonCloserPoints = Math.max(this.playerPoints, !playerHaul.isEmpty());
              }
              if (this.nonCloserPoints === 0) {
                this.announceWinner('computer', 3);
              }
              if (this.nonCloserPoints > 0 && this.nonCloserPoints < 33) {
                this.announceWinner('computer', 2);
              }
              if (this.nonCloserPoints >= 33) {
                this.announceWinner('computer', 1);
              }
            } else {
              this.playerLeads = true;
              if (this.nonCloserPoints > 0) {
                this.announceWinner('computer', 2, 'Unsuccessful fold. ');
              } else {
                this.announceWinner('computer', 3, 'Unsuccessful fold. ');
              }
            }
          }
          this.nextGame();
        } else {
          if (player.getCards().length === 0) {
            gameOver = true;
            if (this.deckCloser === 'player') {
              this.playerLeads = true;
              if (this.nonCloserPoints > 0) {
                this.announceWinner('computer', 2, 'Unsuccessful fold. ');
              } else {
                this.announceWinner('computer', 3, 'Unsuccessful fold. ');
              }
            } else {
              this.playerLeads = false;
              if (this.nonCloserPoints > 0) {
                this.announceWinner('player', 2, 'Unsuccessful fold. ');
              } else {
                this.announceWinner('player', 3, 'Unsuccessful fold. ');
              }
            }
            this.nextGame();
          }
        }
      } else {
        if (this.playerPoints > 65 || this.computerPoints > 65 || autowinner !== 'none') {
          gameOver = true;
          if (this.playerPoints > 65 || autowinner === 'player') {
            this.playerLeads = false;
            if (computerHaul.isEmpty()) {
              this.announceWinner('player', 3);
            }
            if (!computerHaul.isEmpty() && this.computerPoints < 33) {
              this.announceWinner('player', 2);
            }
            if (this.computerPoints >= 33) {
              this.announceWinner('player', 1);
            }
          } else {
            this.playerLeads = true;
            if (playerHaul.isEmpty()) {
              this.announceWinner('computer', 3);
            }
            if (!playerHaul.isEmpty() && this.playerPoints < 33) {
              this.announceWinner('computer', 2);
            }
            if (this.playerPoints >= 33) {
              this.announceWinner('computer', 1);
            }
          }
          this.nextGame();
        } else {
          if (player.isEmpty() && this.playerPoints === 65 && this.computerPoints === 65 && !schnapsenMode) {
            gameOver = true;
            alert("Wow, it's a tie!");
            this.nextGame();
          }
        }
      }
      return gameOver;
    };

    Game.prototype.announceWinner = function(winner, points, preamble) {
      var rest, subject, winnings;
      if (preamble == null) {
        preamble = '';
      }
      if (winner === 'player') {
        this.playerGamepoints += points;
      } else {
        this.computerGamepoints += points;
      }
      subject = {
        'player': 'You win ',
        'computer': 'The computer wins '
      };
      if (points > 1) {
        winnings = "" + points + " game points! ";
      } else {
        winnings = "" + points + " game point. ";
      }
      rest = "So far the score is \n \n Computer: " + this.computerGamepoints + " \n Player: " + this.playerGamepoints + " \n \n Would you like to play again? \n \n";
      alert(preamble + subject[winner] + winnings + rest);
    };

    Game.prototype.nextGame = function() {
      var card, _i, _len, _ref;
      _ref = deck.cards;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        card.reset();
      }
      this.round = 1;
      this.gameNumber += 1;
      this.computerPoints = 0;
      this.playerPoints = 0;
      this.playerProvisional = 0;
      this.computerProvisional = 0;
      this.marriages = '';
      this.computerMarriages = '';
      this.playerMarriages = '';
      this.trumpSuit = '';
      this.deckClosed = false;
      this.deckCloser = '';
      this.nonCloserPoints = 0;
      return setTimeout(this.startNext, 1000);
    };

    Game.prototype.startNext = function() {
      this.initialize();
      if (schnapsenMode) {
        this.playerLeads = this.gameNumber % 2 === 1;
      }
      if (this.playerLeads === false) {
        return setTimeout(computerLead, 1000);
      }
    };

    Game.prototype.showHaul = function() {
      var card, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _results, _results1;
      if (playerHaul.visible) {
        _ref = playerHaul.getCards();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          card.turnDown();
        }
        playerHaul.visible = false;
        _ref1 = playerHaul.getCards();
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          card = _ref1[_j];
          _results.push(card.moveTo(playerHaul.x - 2 * (card.html.style.zIndex - playerHaul.z), playerHaul.y, card.html.style.zIndex));
        }
        return _results;
      } else {
        _ref2 = playerHaul.getCards();
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          card = _ref2[_k];
          card.turnUp();
        }
        playerHaul.visible = true;
        _ref3 = playerHaul.getCards();
        _results1 = [];
        for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
          card = _ref3[_l];
          _results1.push(card.moveTo(playerHaul.x + 15 * (card.html.style.zIndex - playerHaul.z), playerHaul.y, card.html.style.zIndex));
        }
        return _results1;
      }
    };

    return Game;

  })();

  Deck = (function() {

    function Deck() {
      var cards, num, suit, suits, values, _i, _j, _len, _len1;
      suits = ['C', 'D', 'H', 'S'];
      if (schnapsenMode) {
        values = ['10', 'J', 'Q', 'K', 'A'];
      } else {
        values = ['9', '10', 'J', 'Q', 'K', 'A'];
      }
      cards = [];
      for (_i = 0, _len = suits.length; _i < _len; _i++) {
        suit = suits[_i];
        for (_j = 0, _len1 = values.length; _j < _len1; _j++) {
          num = values[_j];
          cards.push(new Card(num, suit));
        }
      }
      this.cards = cards;
    }

    Deck.prototype.find = function(id) {
      var card;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = deck.cards;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          card = _ref[_i];
          if (card.id === id) {
            _results.push(card);
          }
        }
        return _results;
      })())[0];
    };

    Deck.prototype.shuffle = function() {
      return shuffle(this.cards);
    };

    return Deck;

  })();

  Table = (function() {

    function Table() {
      var card, _i, _len, _ref;
      this.html = document.getElementById('table');
      _ref = deck.cards;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        card = _ref[_i];
        this.html.appendChild(card.html);
      }
    }

    return Table;

  })();

  isLegal = function(cardLed, card2, hand2) {
    var card, suitFollowers, suitWinners, trumpCards;
    suitFollowers = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = hand2.length; _i < _len; _i++) {
        card = hand2[_i];
        if (card.suit === cardLed.suit) {
          _results.push(card);
        }
      }
      return _results;
    })();
    suitWinners = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = suitFollowers.length; _i < _len; _i++) {
        card = suitFollowers[_i];
        if (card.rank > cardLed.rank) {
          _results.push(card);
        }
      }
      return _results;
    })();
    trumpCards = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = hand2.length; _i < _len; _i++) {
        card = hand2[_i];
        if (card.isTrump()) {
          _results.push(card);
        }
      }
      return _results;
    })();
    if (!game.deckClosed) {
      return true;
    } else if (suitFollowers.length > 0) {
      if (suitWinners.length > 0) {
        return card2.suit === cardLed.suit && card2.rank > cardLed.rank;
      } else {
        return card2.suit === cardLed.suit;
      }
    } else if (trumpCards.length > 0) {
      return card2.isTrump();
    } else {
      return true;
    }
  };

  computerLead = function() {
    var newTrump, oldTrump;
    if (!game.deckClosed && computer.hasCard(lowRank + game.trumpSuit)) {
      alert("I'm swapping the trump card.");
      oldTrump = trumpCard.select();
      newTrump = deck.find(lowRank + game.trumpSuit);
      oldTrump.html.style.transform = "rotate(0deg)";
      oldTrump.html.style['-webkit-transform'] = "rotate(0deg)";
      newTrump.html.style.transform = "rotate(90deg)";
      newTrump.html.style['-webkit-transform'] = "rotate(90deg)";
      computer.placeDown(oldTrump);
      trumpCard.placeUp(newTrump);
    }
    return ai.bestLead();
  };

  isMarriage = function(value, suit, handLocation) {
    var partner;
    partner = {
      'K': 'Q',
      'Q': 'K'
    };
    return (value === 'K' || value === 'Q') && handLocation.hasCard(partner[value] + suit);
  };

  endRound = function() {
    var autowinner;
    autowinner = 'none';
    if (playerWins()) {
      playerCard.select().playerTakes();
      computerCard.select().playerTakes();
      game.playerLeads = true;
    } else {
      playerCard.select().computerTakes();
      computerCard.select().computerTakes();
      game.playerLeads = false;
    }
    if (player.isEmpty() && talon.isEmpty()) {
      if (game.playerLeads) {
        if (schnapsenMode) {
          autowinner = 'player';
        } else {
          game.playerPoints += 10;
        }
      } else {
        if (schnapsenMode) {
          autowinner = 'computer';
        } else {
          game.computerPoints += 10;
        }
      }
      game.score();
    }
    if (!game.checkWinner(autowinner)) {
      return nextRound();
    }
  };

  nextRound = function() {
    if (!game.deckClosed && game.round > 0) {
      drawCards();
    }
    player.display();
    if (!game.playerLeads) {
      setTimeout(computerLead, 1000);
    }
    return game.round += 1;
  };

  drawCards = function() {
    var special;
    if (talon.getCards().length === 1) {
      special = trumpCard.select();
      special.html.style.transform = "rotate(0deg)";
      special.html.style['-webkit-transform'] = "rotate(0deg)";
      if (game.playerLeads) {
        game.playerDraw(talon);
        computer.placeDown(special);
      } else {
        computer.placeDown(talon.select());
        game.playerDraw(trumpCard);
      }
      return game.deckClosed = true;
    } else {
      game.playerDraw(talon);
      return game.computerDraw(talon);
    }
  };

  /*
  Randomize array element order in-place
  using Fisher-Yates shuffle algorithm.
  */


  shuffle = function(array) {
    var i, j, temp;
    i = array.length - 1;
    while (i > 0) {
      j = Math.floor(Math.random() * (i + 1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
      i--;
    }
    return array;
  };

  cardLedWins = function(cardLed, card2) {
    if (card2.suit === game.trumpSuit) {
      return cardLed.suit === game.trumpSuit && cardLed.rank > card2.rank;
    } else {
      return cardLed.rank > card2.rank || cardLed.suit !== card2.suit;
    }
  };

  compareCards = function(card1, card2) {
    return card2.toNumber() - card1.toNumber();
  };

  playerWins = function() {
    var card1, card2, leaderLoses;
    if (game.playerLeads) {
      card1 = playerCard.select();
      card2 = computerCard.select();
    } else {
      card1 = computerCard.select();
      card2 = playerCard.select();
    }
    leaderLoses = ((card1.suit === card2.suit) && (valueRank[card1.value] < valueRank[card2.value])) || (card1.suit !== game.trumpSuit && card2.suit === game.trumpSuit);
    return leaderLoses !== game.playerLeads;
  };

  game = new Game();

  deck = new Deck();

  table = new Table();

  ai = new ComputerAI();

  talon = new Location('talon', 50, 50, 10, false);

  player = new Location('player', 50, 200, 50, true);

  computer = new Location('computer', 200, -300, 50, false);

  playerCard = new Location('playerCard', 450, 50, 10, true);

  computerCard = new Location('computerCard', 350, 50, 10, true);

  if (schnapsenMode) {
    playerHaul = new Location('playerHaul', 650, 200, 10, false);
  } else {
    playerHaul = new Location('playerHaul', 750, 200, 10, false);
  }

  computerHaul = new Location('computerHaul', 750, -300, 10, false);

  trumpCard = new Location('trumpCard', 100, 50, 5, true);

  window.onload = function() {
    return game.initialize();
  };

}).call(this);
