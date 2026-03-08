// Online Ranking Module
const Ranking = {
    COLLECTION_NAME: 'rankings',
    MAX_NAME_LENGTH: 12,
    MAX_SCORE: 100000,
    STORAGE_KEY_NAME: 'jellyfish_player_name',

    // Submit score to Firestore
    submitScore: function (name, score, callback) {
        var self = this;

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

        var data = {
            playerName: name,
            score: score,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection(this.COLLECTION_NAME).add(data)
            .then(function () {
                self.savePlayerName(name);
                if (callback) callback(true, null);
            })
            .catch(function (error) {
                console.error('Ranking submit error:', error);
                if (callback) callback(false, 'ネットワークエラーが発生しました');
            });
    },

    // Get top N rankings from Firestore
    getTopRanking: function (limit, callback) {
        limit = limit || 10;

        db.collection(this.COLLECTION_NAME)
            .orderBy('score', 'desc')
            .limit(limit)
            .get()
            .then(function (querySnapshot) {
                var rankings = [];
                querySnapshot.forEach(function (doc) {
                    var data = doc.data();
                    rankings.push({
                        playerName: data.playerName,
                        score: data.score,
                        createdAt: data.createdAt ? data.createdAt.toDate() : null
                    });
                });
                if (callback) callback(true, rankings);
            })
            .catch(function (error) {
                console.error('Ranking fetch error:', error);
                if (callback) callback(false, null);
            });
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
