// Local Ranking Module (localStorage)
const Ranking = {
    RANKINGS_KEY: 'jellyfish_rankings',
    MAX_NAME_LENGTH: 12,
    MAX_SCORE: 100000,
    MAX_ENTRIES: 10,
    STORAGE_KEY_NAME: 'jellyfish_player_name',

    // Submit score to localStorage
    submitScore: function (name, score, callback) {
        // Validation
        if (!name || name.trim().length === 0) {
            if (callback) callback(false, '名前を入力してください');
            return;
        }
        name = name.trim().substring(0, this.MAX_NAME_LENGTH);
        if (score < 0 || score > this.MAX_SCORE) {
            if (callback) callback(false, '無効なスコアです');
            return;
        }

        try {
            var rankings = this._load();
            rankings.push({
                playerName: name,
                score: score,
                date: new Date().toISOString()
            });
            rankings.sort(function (a, b) { return b.score - a.score; });
            rankings = rankings.slice(0, this.MAX_ENTRIES);
            localStorage.setItem(this.RANKINGS_KEY, JSON.stringify(rankings));
            this.savePlayerName(name);
            if (callback) callback(true, null);
        } catch (e) {
            console.error('Ranking submit error:', e);
            if (callback) callback(false, '保存に失敗しました');
        }
    },

    // Get top N rankings from localStorage
    getTopRanking: function (limit, callback) {
        limit = limit || 10;
        try {
            var rankings = this._load().slice(0, limit);
            if (callback) callback(true, rankings);
        } catch (e) {
            console.error('Ranking fetch error:', e);
            if (callback) callback(false, null);
        }
    },

    // Internal: load rankings array from localStorage
    _load: function () {
        try {
            var data = localStorage.getItem(this.RANKINGS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    // Save player name to localStorage
    savePlayerName: function (name) {
        try {
            localStorage.setItem(this.STORAGE_KEY_NAME, name);
        } catch (e) { }
    },

    // Get last used player name from localStorage
    getLastPlayerName: function () {
        try {
            return localStorage.getItem(this.STORAGE_KEY_NAME) || '';
        } catch (e) {
            return '';
        }
    }
};
