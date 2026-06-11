package logger

import (
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
)

var log zerolog.Logger

func Init(level string, pretty bool) {
	lvl, err := zerolog.ParseLevel(level)
	if err != nil {
		lvl = zerolog.InfoLevel
	}

	zerolog.TimeFieldFormat = time.RFC3339Nano

	var out io.Writer = os.Stdout
	if pretty {
		out = zerolog.NewConsoleWriter(func(w *zerolog.ConsoleWriter) {
			w.TimeFormat = "15:04:05.000"
		})
	}

	log = zerolog.New(out).
		Level(lvl).
		With().
		Timestamp().
		Caller().
		Logger()
}

func L() *zerolog.Logger {
	return &log
}

func Info() *zerolog.Event {
	return log.Info()
}

func Error() *zerolog.Event {
	return log.Error()
}

func Fatal() *zerolog.Event {
	return log.Fatal()
}

func Warn() *zerolog.Event {
	return log.Warn()
}

func Debug() *zerolog.Event {
	return log.Debug()
}

func WithRequestID(id string) zerolog.Logger {
	return log.With().Str("request_id", id).Logger()
}
