(function() {

	// Square
	function Square(x, y, isMine) {
		this.x = x;
		this.y = y;
		this.isMine = isMine;

		this.render();
	}
	Square.prototype.x = null;
	Square.prototype.y = null;
	Square.prototype.isMine = null;
	Square.prototype.isRevealed = false;
	Square.prototype.isFlagged = false;
	Square.prototype.up = null;
	Square.prototype.right = null;
	Square.prototype.down = null;
	Square.prototype.left = null;
	Square.prototype.elm = null;
	Square.prototype.forEachSurrounding = function(callback) {
		this.up && callback.call(this, this.up);
		this.right && callback.call(this, this.right);
		this.down && callback.call(this, this.down);
		this.left && callback.call(this, this.left);

		this.up && this.up.left && callback.call(this, this.up.left);
		this.up && this.up.right && callback.call(this, this.up.right);
		this.down && this.down.left && callback.call(this, this.down.left);
		this.down && this.down.right && callback.call(this, this.down.right);
	}
	Square.prototype.getNumber = function() {
		var number = 0;
		this.forEachSurrounding(function(square) {
			square.isMine && number++;
		});

		return number;
	}
	Square.prototype.reveal = function(gameOver) {
		if (this.isRevealed)
			return;

		this.isRevealed = true;
		if (!gameOver)
			this.isFlagged = false;
		this.render();

		var n = this.getNumber();
		if (!this.isMine && n === 0) {
			this.forEachSurrounding(function(square) {
				square.reveal();
			});
		}

		return this.isMine;
	}
	Square.prototype.toggleFlag = function() {
		if (this.isRevealed)
			return;
		this.isFlagged = !this.isFlagged;
		this.render();

		return this.isFlagged;
	}
	Square.prototype.render = function() {
		if (!this.elm) {
			this.elm = document.createElement('td');
		}
		if (this.isMine) {
			this.elm.classList.add('isMine');
			if (this.isRevealed) {
				this.elm.classList.add('mine');
			}
		}
		if (this.isRevealed && !this.isMine) {
			var n = this.getNumber();
			this.elm.classList.add('revealed', 'revealed-' + n);
			this.elm.innerText = n;
		}
		if (this.isFlagged)
			this.elm.classList.add('flag');
		else
			this.elm.classList.remove('flag');
	}


	// Board
	function Board(w, h, minesPercentage) {
		this.w = w;
		this.h = h;
		this.minesPercentage = minesPercentage;

		this._init();
	}
	Board.prototype.w = null;
	Board.prototype.h = null;
	Board.prototype.minesPercentage = null;
	Board.prototype.element = null;
	Board.prototype._squares = [];
	Board.prototype.forEachSquare = function(callback, screenOrder) {
		if (screenOrder) {
			for (var y = this.h - 1; y >= 0; y--) {
				for (var x = 0; x < this.w; x++) {
					callback.call(this, this._squares[x][y]);
				}
			}
		} else {
			for (var x = 0; x < this.w; x++) {
				for (var y = 0; y < this.h; y++) {
					callback.call(this, this._squares[x][y]);
				}
			}
		}
	};
	Board.prototype._init = function(callback) {
		// Create Squares
		for (var x = 0; x < this.w; x++) {
			this._squares[x] = [];
			for (var y = 0; y < this.h; y++) {
				var isMine = (Math.random() < (this.minesPercentage / 100));
				this._squares[x][y] = new Square(x, y, isMine);
			}
		}

		// Link squares
		this.forEachSquare(function(square) {
			square.up = (square.y === this.h - 1) ? null : this._squares[square.x][square.y + 1];
			square.right = (square.x === this.w - 1) ? null : this._squares[square.x + 1][square.y];
			square.down = (square.y === 0) ? null : this._squares[square.x][square.y - 1];
			square.left = (square.x === 0) ? null : this._squares[square.x - 1][square.y];
		});

		// Initial Render
		this.element = document.createElement('table');
		var row;
		this.forEachSquare(function(square) {
			if (square.x === 0) {
				// Create a new row
				row = document.createElement('tr');
				this.element.appendChild(row);
			}
			row.appendChild(square.elm);
		}, true);
	};

	function bombsweeper(w, h, minesPercentage, container) {
		this.w = w;
		this.h = h;
		this.minesPercentage = minesPercentage;
		this.container = container;
		this.state = null;
		this.startedAt = null;
		this.stats = {
			flags: null,
			smiley: null,
			time: null
		};

		this._init();
	}
	bombsweeper.prototype._init = function() {
		var game = this;

		//Start
		this.state = 'running';
		this.startedAt = (new Date()).getTime();

		// Generate board
		this.board = new Board(this.w, this.h, this.minesPercentage);
		this.container.innerHTML = '';
		this.renderStats();
		setInterval(function() {
			game.renderStats.call(game);
		}, 1000);
		this.container.appendChild(this.board.element);

		// Bind events
		this.board.forEachSquare(function(square) {
			square.elm.addEventListener('click', function(e) {
				if (game.state !== 'running')
					return;

				var n = square.reveal();
				game.checkState();
			});
			square.elm.addEventListener('mousedown', function(e) {
				if (game.state !== 'running')
					return;

				if (e.button == 2) {
					square.toggleFlag();
					game.checkState();
				}
			});
			square.elm.addEventListener("contextmenu", function(e){
				e.preventDefault();
			}, false);
		});
	}
	bombsweeper.prototype.renderStats = function() {
		if (!this.stats.flags) {
			var stats = document.createElement('div');
			this.stats.flags = document.createElement('div');
			this.stats.time = document.createElement('div');
			this.stats.smiley = document.createElement('div');

			stats.classList.add('stats');
			this.stats.flags.classList.add('flags');
			this.stats.time.classList.add('time');
			this.stats.smiley.classList.add('smiley');

			stats.appendChild(this.stats.flags);
			stats.appendChild(this.stats.time);
			stats.appendChild(this.stats.smiley);

			this.container.appendChild(stats);
		}

		var flagsRemaining = 0;

		this.board.forEachSquare(function(square) {
			if (square.isMine)
				flagsRemaining++;
			if (square.isFlagged)
				flagsRemaining--;
		});

		this.stats.flags.innerText = flagsRemaining;
		
		if (this.state === 'running')
			this.stats.time.innerText = Math.floor(((new Date()).getTime() - this.startedAt)/1000);

		switch(this.state) {
			case 'running':
				this.stats.smiley.innerHTML = '&#9786;'; // Smiling face
				break;
			case 'won':
				this.stats.smiley.innerHTML = '&#9734;'; // Star
				break;
			case 'lost':
				this.stats.smiley.innerHTML = '&#9785;'; // Frowning face
				break;
			default:
				this.stats.smiley.innerHTML = '?';
		}
	}
	bombsweeper.prototype.checkState = function() {
		var allRevealed = true,
			allFlagged = true,
			mineRevealed = false;

		this.board.forEachSquare(function(square) {
			if (square.isMine && !square.isFlagged)
				allFlagged = false;
			if (!square.isMine && !square.isRevealed)
				allRevealed = false;
			if (square.isMine && square.isRevealed)
				mineRevealed = true;
		});

		if (allRevealed || allFlagged || mineRevealed) {
			this.board.forEachSquare(function(square) {
				square.isMine && square.reveal(true);
			});
		}	

		if (mineRevealed)
			this.state = 'lost';
		else if (allRevealed || allFlagged)
			this.state = 'won';

		this.renderStats();
	}

	window.bombsweeper = bombsweeper;

})();