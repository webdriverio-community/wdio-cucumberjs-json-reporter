module.exports = {
    plugins: [
        'transform-function-bind',
    ],
    presets: [
        [ '@babel/preset-env',
            {
                targets: {
                    node: 8
                },
            },
        ],
    ],
}
