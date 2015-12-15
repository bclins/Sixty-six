''' 
A program to let the user play sixty-six and schnapsen against the computer.

To do: Make the computer smarter. 
'''

if schnapsenMode
  lowRank = 'J'
else
  lowRank = '9'

alternateDeals = 1 # always counts as true in schnapsenMode, but in sixty-six the winner deals if set to false.  

cardPath = 'images/cards/'

suitNumber = {C: 3, D: 0, H: 2, S: 1}

suitString = {C: '&clubs;', D: '<span style="color:red">&diams;</span>', H: '<span style="color:red">&hearts;</span>', S: '&spades;'}

valueRank = {9: 9, 10: 13, J: 10, Q: 11, K: 12, A: 14}
valuePoints = {9: 0, 10: 10, J: 2, Q: 3, K: 4, A: 11}
#valuePoints = {9: 0, 10: 10, J: 0, Q: 0, K: 10, A: 10}

randElement = (array) -> array[Math.floor(Math.random() * array.length)]

class ComputerAI
  constructor: () ->
    this.baseCardValues = {9: 0, 10: 10, J: 2, Q: 3, K: 4, A: 11}
    this.trumpValueBonus = 9
    this.marriageBonus = 10
    this.aggressive = false
  cardValue: (card) ->
    value = this.baseCardValues[card.value]
    if card.suit == game.trumpSuit
      value += this.trumpValueBonus # there should be a more nuanced value system...
    if isMarriage(card.id[0],card.id[1],computer) and (not game.deckClosed or schnapsenMode)
      value += Math.max(this.marriageBonus - game.round,0)
    return value
  cardTracker: (id) ->
    card = deck.find(id)
    if card.location in ['talon','player'] and not (card.suit in game.marriages and card.value in ['K','Q']) and not talon.isEmpty()
      return 'unknown'
    else
      return location
  unaccountedCards: () ->
    (card for card in deck.cards when this.cardTracker(card.id) == 'unknown')
  beatsAll: (computerCard,otherCards) ->
    # returns true if the computerCard is guaranteed to win against all of the otherCards
    wins = (cardLedWins(computerCard,card) for card in otherCards)
    wins.reduce (x,y) -> x and y
  certainWin: (computerCard) ->
    # returns true if the computerCard is guaranteed to win
    possibleCards = this.unaccountedCards().concat player.getCards()
    if game.deckClosed
      if player.hasSuit(computerCard.suit)
        suitMatches = (card for card in possibleCards when card.suit == computerCard.suit)
        return this.beatsAll(computerCard,suitMatches)
      else
        return not player.hasSuit(game.trumpSuit)
    else
      return this.beatsAll(computerCard,possibleCards)
  topCards: () ->
    # returns the cards in the computer's hand that are higher than any unseen cards in their own suit.
    otherCards = this.unaccountedCards().concat player.getCards()
    hand = computer.getCards()
    return (card for card in hand when card.rank > Math.max((other.rank for other in otherCards when other.suit == card.suit)...))
  bestLead: () ->
    # select the best card in the computer's hand to lead
    options = computer.getCards()
    nontrumpOptions = (card for card in options when not card.isTrump())
    certainWinners = (card for card in options when this.certainWin(card))
    nontrumpWinners = (card for card in certainWinners when not card.isTrump())
    marriageCards = (card for card in options when isMarriage(card.value,card.suit,computer))
    trumpMarriageCards = (card for card in marriageCards when card.suit == game.trumpSuit)
    if game.playerPoints > 45 or game.computerPoints > 45
      this.aggressive = true
    else
      this.aggressive = false
    toppers = this.topCards()
    if toppers.length > 0
      likelyPoints = (card.points for card in toppers).reduce((a,b)->a+b)+game.computerPoints
    else
      likelyPoints = 0
    if marriageCards.length > 0 and schnapsenMode
      likelyPoints += 10
    if trumpMarriageCards.length > 0 and schnapsenMode
      likelyPoints += 10
    topTrumps = (card for card in toppers when card.isTrump())
    if ((likelyPoints > 55 and topTrumps.length > 1) or (likelyPoints > 65 and topTrumps.length > 0)) and not game.deckClosed
      game.computerClose()
    # Heuristic: If you have a guaranteed winner that is not a trump card, play it.
    if nontrumpWinners.length > 0
      randElement(nontrumpWinners).computerPlay()
    # Heuristic: If you are playing aggressively, play a winner if you have one.
    else if certainWinners.length > 0 and this.aggressive
      if schnapsenMode or (not schnapsenMode and (game.deckClosed or marriageCards.length == 0))
        certainWinners[0].computerPlay()
      else
        if trumpMarriageCards.length > 0
          trumpMarriageCards[0].computerPlay()
        else
          marriageCards[0].computerPlay()
    # Heuristic: Play a marriage if you have one.
    else if marriageCards.length > 0 and (not game.deckClosed or schnapsenMode)
      if trumpMarriageCards.length > 0
        trumpMarriageCards[0].computerPlay()
      else
        marriageCards[0].computerPlay()
    # Heuristic: If you don't have a marriage, lead with your lowest value card.
    else
      this.worstCard(options).computerPlay()
  netValue: (card,playersCard) ->
    if cardLedWins(playersCard,card)
      return -playersCard.points-this.cardValue(card)
    else
      return card.points+playersCard.points-this.cardValue(card)
  worstCard: (options) ->
    options.sort((a,b)=>this.cardValue(a)-this.cardValue(b))
    options[0]
  bestValue: (options,playersCard) ->
    options.sort((a,b)=>this.netValue(b,playersCard)-this.netValue(a,playersCard))
    options[0]
  bestFollow: () =>
    options = computer.getCards()
    playersCard = playerCard.select()
    if game.playerPoints > 45 or game.computerPoints > 45
      this.aggressive = true
    else
      this.aggressive = false
    legalOptions = (card for card in options when isLegal(playersCard,card,options))
    winningOptions = (card for card in legalOptions when not cardLedWins(playersCard,card))
    # The computer needs to do a better job at saving high value trump cards...
    if this.aggressive and winningOptions.length > 0
      winningOptions[0].computerPlay()
    else
      this.bestValue(legalOptions,playersCard).computerPlay()
    # Here is a good heuristic: if you have a marriage and there is time left to play it, then you should play aggressive (but you have to make sure that you don't spoil the marriage by playing aggressively!)

class Card
  constructor: (value,suit) ->
    this.suit = suit
    this.value = value
    this.rank = valueRank[this.value]
    this.points = valuePoints[this.value]
    this.id = this.value+this.suit
    this.isTrump = () -> this.suit == game.trumpSuit
    this.toString = () -> this.value+suitString[this.suit]
    this.front = "<img src='#{cardPath}#{this.id}.png'></img>"
    this.back = "<img src='#{cardPath}back.png'></img>"
    this.turnedUp = false
    this.html = document.createElement("div")
    this.html.innerHTML = this.back
    this.html.style.zIndex = 10
    this.html.style.left = "50px"
    this.html.style.top = "50px"
    this.toNumber = () -> 16*suitNumber[this.suit]+valueRank[this.value]
    this.location = 'talon'
    this.html.addEventListener("click",this.cardAction)
  cardAction: () =>
    switch this.location
      when "talon" then game.playerClose()
      when "player" then this.playCard()
      when "trumpCard" then this.swap()
      when "playerHaul" then game.showHaul()
  moveTo: (x,y,z=10) ->
    this.html.style.left = x+"px"
    this.html.style.top = y+"px"
    this.html.style.zIndex = z
  turnUp: () ->
    this.html.innerHTML = this.front
    this.faceUp = true
  turnDown: () ->
    this.html.innerHTML = this.back
    this.faceUp = false
  playCard: () =>
    if playerCard.isEmpty()
      hand = player.getCards()
      if game.playerLeads or isLegal(computerCard.select(),this,hand)
        playerCard.placeUp(this)
        if game.playerLeads
          if isMarriage(this.value,this.suit,player) and (schnapsenMode or not game.deckClosed)
            game.marriages += this.suit
            game.playerMarriages += suitString[this.suit]
            if this.suit == game.trumpSuit
              game.playerPoints += 40
            else
              game.playerPoints += 20
            game.score()
            gameOver = game.checkWinner()
          if not gameOver
            ai.bestFollow()
        if not gameOver
          setTimeout(endRound,1200)
      else
        alert("Now that the stack is closed, you must follow suit! You must also win the trick if you can.")
  computerPlay: () =>
    hand = computer.getCards()
    computerCard.placeUp(this)
    if not game.playerLeads
      if isMarriage(this.value,this.suit,computer) and (schnapsenMode or not game.deckClosed)
        game.marriages += this.suit
        game.computerMarriages += suitString[this.suit]
        if this.suit == game.trumpSuit
          game.computerPoints += 40
          alert('Royal marriage!')
        else
          game.computerPoints += 20
          alert('Marriage!')
        game.score()
        game.checkWinner()
  playerTakes: () =>
    playerHaul.stack(this)
    game.playerPoints += this.points
  computerTakes: () =>
    computerHaul.stack(this)
    game.computerPoints += this.points
  swap: () =>
    if player.hasCard(lowRank+game.trumpSuit) and game.playerLeads
      player.placeUp(this)
      this.html.style.transform = "rotate(0deg)"
      this.html.style['-webkit-transform'] = "rotate(0deg)"
      newTrump = deck.find(lowRank+game.trumpSuit)
      trumpCard.placeUp(newTrump)
      newTrump.html.style.transform = "rotate(90deg)"
      newTrump.html.style['-webkit-transform'] = "rotate(90deg)"
      player.display()
  reset: () ->
    this.turnDown()
    this.location = 'talon'
    this.html.style.transform = 'rotate(0deg)'
    this.html.style['-webkit-transform'] = "rotate(0deg)"
    this.moveTo(50,50,10)

class Location
  constructor: (name,x,y,z,visible) ->
    this.name = name
    this.x = x
    this.y = y
    this.z = z
    this.visible = visible
  getCards: () ->
    card for card in deck.cards when card.location == this.name
  getSuits: () ->
    card.suit for card in deck.cards when card.location == this.name
  select: () ->
    this.getCards().pop()
  hasSuit: (suit) ->
    suit in (card.suit for card in this.getCards())
  hasCard: (id) ->
    id in (card.id for card in this.getCards())
  isEmpty: () ->
    this.getCards().length == 0
  stack: (newCard) ->
    height = this.getCards().length
    if this.visible
      newCard.moveTo(this.x+15*height,this.y,this.z+height)
      newCard.turnUp()
    else
      newCard.moveTo(this.x-2*height,this.y,this.z+height)
      newCard.turnDown()
    newCard.location = this.name
  placeUp: (newCard) ->
    newCard.turnUp()
    newCard.location = this.name
    newCard.moveTo(this.x,this.y,this.z)
  placeDown: (newCard) ->
    newCard.turnDown()
    newCard.location = this.name
    newCard.moveTo(this.x,this.y,this.z)
  display: () ->
    # spread sorted cards out face up
    hand = this.getCards()
    hand.sort(compareCards)
    card.moveTo(this.x + 100*i,this.y,this.z) for card, i in hand

class Game
  constructor: () ->
    this.computerPoints = 0
    this.playerPoints = 0
    this.computerGamepoints = 0
    this.playerGamepoints = 0
    this.marriages = '' # right now, this is only used by the cardTracker...
    this.computerMarriages = ''
    this.playerMarriages = ''
    this.trumpSuit = ''
    this.playerLeads = true
    this.deckClosed = false
    this.deckCloser = ''
    this.nonCloserPoints = 0
    this.round = 1
    this.gameNumber = 1
  initialize: () ->
    deck.shuffle()
    # deal player cards
    if schnapsenMode
      player.placeUp(card) for card in deck.cards[15..19]
    else
      player.placeUp(card) for card in deck.cards[18..24]
    player.display()
    # deal computer cards
    if schnapsenMode
      computer.placeDown(card) for card in deck.cards[10..14]
    else
      computer.placeDown(card) for card in deck.cards[12..17]
    # make the trump card
    if schnapsenMode
      special = deck.cards[9]
    else
      special = deck.cards[11]
    trumpCard.placeUp(special)
    special.html.style.transform = "rotate(90deg)"
    special.html.style['-webkit-transform'] = "rotate(90deg)"
    this.trumpSuit = special.suit
    # stack the talon nicely
    if schnapsenMode
      card.location = 'talon' for card in deck.cards[0..8]
    else
      card.location = 'talon' for card in deck.cards[0..10]
    card.moveTo(talon.x - 2*i,talon.y,talon.z+i) for card, i in talon.getCards()
    # post the initial score
    this.score()
  playerDraw: (location) ->
    card = location.select()
    player.placeUp(card)
    player.display()
  computerDraw: (location) ->
    card = location.select()
    computer.placeDown(card)
  playerClose: () =>
    if this.playerLeads
      trumpCard.getCards()[0].turnDown()
      this.deckClosed = true
      this.deckCloser = 'player'
      # For Viennese style closing in Schnapsen:
      this.nonCloserPoints = Math.max(this.computerPoints*(not computerHaul.isEmpty()),not computerHaul.isEmpty())
  computerClose: () =>
    alert("I'm closing the stack.")
    trumpCard.getCards()[0].turnDown()
    this.deckClosed = true
    this.deckCloser = 'computer'
    # For Viennese style closing in Schnapsen:
    this.nonCloserPoints = Math.max(this.playerPoints*(not playerHaul.isEmpty()),not playerHaul.isEmpty())
  score: () ->
    if playerHaul.isEmpty()
      playerProvisional = 0
    else
      playerProvisional = this.playerPoints
    if computerHaul.isEmpty()
      computerProvisional = 0
    else
      computerProvisional = this.computerPoints
    document.getElementById("scorebar").innerHTML="<p>You: #{playerProvisional} points. #{this.playerMarriages} &nbsp;  &nbsp; &nbsp; &nbsp; &nbsp; Trump: <span style='font-size:22px;'>#{suitString[this.trumpSuit]}</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Computer: #{computerProvisional} points. #{this.computerMarriages}"
  checkWinner: (lastTrickWinner='none') =>
    gameOver = false
    this.score()
    if this.deckCloser.length > 0 # If someone has closed the deck
      if this.playerPoints > 65 or this.computerPoints > 65
        gameOver = true
        if this.playerPoints > 65
          if this.deckCloser == 'player'
            this.playerLeads = false
            if not schnapsenMode # In 66, score in this case depends on current points.
              this.nonCloserPoints = Math.max(this.computerPoints*(not computerHaul.isEmpty()),not computerHaul.isEmpty())
            if this.nonCloserPoints == 0
              this.announceWinner('player',3)
            if this.nonCloserPoints > 0 and this.nonCloserPoints < 33
              this.announceWinner('player',2)
            if this.nonCloserPoints >= 33
              this.announceWinner('player',1)
          else # if the computer was the one who closed the deck (but player got 66).
            this.playerLeads = false
            if this.nonCloserPoints > 0
              this.announceWinner('player',2,'Unsuccessful fold. ')
            else
              this.announceWinner('player',3,'Unsuccessful fold. ')
        else # if the computer got 66 after deck was closed.
          if this.deckCloser == 'computer'
            this.playerLeads = true
            if not schnapsenMode
              this.nonCloserPoints = Math.max(this.playerPoints*(not playerHaul.isEmpty()),not playerHaul.isEmpty())
            if this.nonCloserPoints == 0
              this.announceWinner('computer',3)
            if this.nonCloserPoints > 0 and this.nonCloserPoints < 33
              this.announceWinner('computer',2)
            if this.nonCloserPoints >= 33
              this.announceWinner('computer',1)
          else #if it was the player who closed the deck (but computer got 66).
            this.playerLeads = true
            if this.nonCloserPoints > 0
              this.announceWinner('computer',2,'Unsuccessful fold. ')
            else
              this.announceWinner('computer',3,'Unsuccessful fold. ')
        this.nextGame()
      else # No one has 66 points yet
        if player.getCards().length == 0
          gameOver = true
          if this.deckCloser == 'player'
            this.playerLeads = true
            if this.nonCloserPoints > 0
              this.announceWinner('computer',2,'Unsuccessful fold. ')
            else
              this.announceWinner('computer',3,'Unsuccessful fold. ')
          else # computer closed the deck but didn't get 66 points
            this.playerLeads = false
            if this.nonCloserPoints > 0
              this.announceWinner('player',2,'Unsuccessful fold. ')
            else
              this.announceWinner('player',3,'Unsuccessful fold. ')
          this.nextGame()
    else # if the deck was not closed
      if this.playerPoints > 65 or this.computerPoints > 65 # if someone has reached 66
        gameOver = true
        if this.playerPoints > 65 or lastTrickWinner == 'player' # if player is the winner
          this.playerLeads = false
          if computerHaul.isEmpty()
            this.announceWinner('player',3)
          else
            if this.computerPoints < 33
              this.announceWinner('player',2)
            else
              this.announceWinner('player',1)
        else # computer is the first to reach 66.
          this.playerLeads = true
          if playerHaul.isEmpty()
            this.announceWinner('computer',3)
          else
            if this.playerPoints < 33
              this.announceWinner('computer',2)
            else
              this.announceWinner('computer',1)
        this.nextGame()
      else # no one has 66 points yet and the deck isn't closed.
        if player.isEmpty() and this.playerPoints == 65 and this.computerPoints == 65
          gameOver = true
          if schnapsenMode
            this.announceWinner(lastTrickWinner,1)
          else
            alert("Wow, it's a tie!")
          this.nextGame()
    return gameOver
  announceWinner: (winner,points,preamble = '') ->
    if winner == 'player'
      this.playerGamepoints += points
    else
      this.computerGamepoints += points
    subject = {'player': 'You win ','computer': 'The computer wins '}
    if points > 1
      winnings = "#{points} game points! "
    else
      winnings = "#{points} game point. "
    rest = "So far the score is \n \n Computer: #{this.computerGamepoints} \n Player: #{this.playerGamepoints} \n \n Would you like to play again? \n \n"
    alert(preamble+subject[winner]+winnings+rest)
    return
  nextGame: () ->
    card.reset() for card in deck.cards
    this.round = 1
    this.gameNumber += 1
    this.computerPoints = 0
    this.playerPoints = 0
    this.marriages = ''
    this.computerMarriages = ''
    this.playerMarriages = ''
    this.trumpSuit = ''
    this.deckClosed = false
    this.deckCloser = ''
    this.nonCloserPoints = 0
    setTimeout(this.startNext,1000)
  startNext: () =>
    this.initialize()
    if schnapsenMode or alternateDeals
      this.playerLeads = (this.gameNumber % 2 == 1)
    if this.playerLeads == false
      setTimeout(computerLead,1000)
  showHaul: () ->
    if playerHaul.visible
      card.turnDown() for card in playerHaul.getCards()
      playerHaul.visible = false
      card.moveTo(playerHaul.x-2*(card.html.style.zIndex-playerHaul.z),playerHaul.y,card.html.style.zIndex) for card in playerHaul.getCards()
    else
      card.turnUp() for card in playerHaul.getCards()
      playerHaul.visible = true
      card.moveTo(playerHaul.x + 15*(card.html.style.zIndex-playerHaul.z),playerHaul.y,card.html.style.zIndex) for card in playerHaul.getCards()
      #setTimeout(this.showHaul,4000)

class Deck # extends Stack
  constructor: () ->
    suits = ['C','D','H','S']
    if schnapsenMode
      values = ['10','J','Q','K','A']
    else
      values = ['9','10','J','Q','K','A']
    cards = []
    cards.push new Card(num,suit) for num in values for suit in suits
    this.cards = cards
  find: (id) ->
    (card for card in deck.cards when card.id == id)[0]
  shuffle: () -> shuffle(this.cards)


class Table
  constructor: () ->
    this.html = document.getElementById('table')
    for card in deck.cards
      this.html.appendChild(card.html)

isLegal = (cardLed,card2,hand2) ->
  suitFollowers = (card for card in hand2 when card.suit == cardLed.suit)
  suitWinners = (card for card in suitFollowers when card.rank > cardLed.rank)
  trumpCards = (card for card in hand2 when card.isTrump())
  if not game.deckClosed
    return true
  else if suitFollowers.length > 0
    if suitWinners.length > 0
      return card2.suit == cardLed.suit and card2.rank > cardLed.rank
    else
      return card2.suit == cardLed.suit
  else if trumpCards.length > 0
    return card2.isTrump()
  else
    return true
    
computerLead = () ->
  if not game.deckClosed and computer.hasCard(lowRank+game.trumpSuit)
      alert("I'm swapping the trump card.")
      oldTrump = trumpCard.select()
      newTrump = deck.find(lowRank+game.trumpSuit)
      oldTrump.html.style.transform = "rotate(0deg)"
      oldTrump.html.style['-webkit-transform'] = "rotate(0deg)"
      newTrump.html.style.transform = "rotate(90deg)"
      newTrump.html.style['-webkit-transform'] = "rotate(90deg)"
      computer.placeDown(oldTrump)
      trumpCard.placeUp(newTrump)
  ai.bestLead()

isMarriage = (value,suit,handLocation) =>
  partner = {'K':'Q','Q':'K'}
  return value in ['K','Q'] and handLocation.hasCard(partner[value]+suit)

endRound = () ->
  if playerWins()
    playerCard.select().playerTakes()
    computerCard.select().playerTakes()
    game.playerLeads = true
    lastTrickWinner = 'player'
  else
    playerCard.select().computerTakes()
    computerCard.select().computerTakes()
    game.playerLeads = false
    lastTrickWinner = 'computer'
  if player.isEmpty() and talon.isEmpty()
    if game.playerLeads
      game.playerPoints += 10
    else
      game.computerPoints += 10
    game.score()
  if not game.checkWinner(lastTrickWinner)
    nextRound()

nextRound = () ->
  if not game.deckClosed and game.round > 0
    drawCards()
  player.display()
  if not game.playerLeads
    setTimeout(computerLead,1000)
  game.round += 1

drawCards = () ->
  if talon.getCards().length == 1
    special = trumpCard.select()
    special.html.style.transform = "rotate(0deg)"
    special.html.style['-webkit-transform'] = "rotate(0deg)"
    if game.playerLeads
      game.playerDraw(talon)
      computer.placeDown(special)
    else
      computer.placeDown(talon.select())
      game.playerDraw(trumpCard)
    game.deckClosed = true
  else
    game.playerDraw(talon)
    game.computerDraw(talon)
  
###
Randomize array element order in-place
using Fisher-Yates shuffle algorithm.
###
shuffle = (array) ->
	i = array.length - 1
	while i > 0
		j = Math.floor(Math.random() * (i + 1))
		temp = array[i]
		array[i] = array[j]
		array[j] = temp
		i--
	return array
 
cardLedWins = (cardLed,card2) ->
  if card2.suit == game.trumpSuit
    return cardLed.suit == game.trumpSuit and cardLed.rank > card2.rank
  else
    return cardLed.rank > card2.rank or cardLed.suit != card2.suit

compareCards = (card1,card2) ->
  card2.toNumber() - card1.toNumber()

playerWins = () ->
  if game.playerLeads
    card1 = playerCard.select()
    card2 = computerCard.select()
  else
    card1 = computerCard.select()
    card2 = playerCard.select()
  leaderLoses = ((card1.suit == card2.suit) and (valueRank[card1.value]<valueRank[card2.value])) or (card1.suit != game.trumpSuit and card2.suit == game.trumpSuit)
  return leaderLoses != game.playerLeads # returns true if the player won. 


game = new Game()
deck = new Deck()
table = new Table()
ai = new ComputerAI()
talon = new Location('talon',50,50,10,false)
player = new Location('player',50,200,50,true)
computer = new Location('computer',200,-300,50,false)
playerCard = new Location('playerCard',450,50,10,true)
computerCard = new Location('computerCard',350,50,10,true)
if schnapsenMode
  playerHaul = new Location('playerHaul',650,200,10,false)
else
  playerHaul = new Location('playerHaul',750,200,10,false)
computerHaul = new Location('computerHaul',750,-300,10,false)
trumpCard = new Location('trumpCard',100,50,5,true)


window.onload=->
  game.initialize()

