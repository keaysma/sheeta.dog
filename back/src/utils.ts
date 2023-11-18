export const uniqueId = () =>
    Math.random()       // 0.4008109220233156
        .toString(16)   // '0.669b8b69f8415'
        .substring(2)   // '669b8b69f8415'
        .padStart(      // 'fff669b8b69f8415'
            16, 
            Number(0xFF).toString(16)
        )
        .toUpperCase() // 'FFF669B8B69F8415'