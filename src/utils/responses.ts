export function sendResponse(data : unknown, msg = 'Success!') {
    return {
        'success' : true,
        'message' : msg,
        'data' : data,
    };
}

export function sendError(data : unknown, msg = 'Something just went wrong :(') {
    return {
        'success' : false,
        'message' : msg,
        'data' : data,
    };
}