"use strict";
exports.handleApiResponse = function(req, res, status, next) {
    return function (err, result) {
        if (err) {
            return next(err);
        }
        res.status(status).json(result);
    };
};
