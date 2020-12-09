# Statsbit

Here is the NewRelic drop in replacement. It works with all NewRelic agents that supports 17th protocol version.
In BIA we use agents for ruby, python, go, java.

Statsbit consists of Backend and UI.
Backend is written in Clojure and stores data in TimescaleDB.
UI is build on top of Grafana.

## Setup

Statsbit requires Postgres with the Timescale extension.
We run Statsibt on Postgres 11 and Timescale 1.7.4.
I plan to support upcoming Timescale 2.0 too.
I've successfully tested some requests on Postgres 12, so you may help us to test Statsbit on 12th version.

## License

Copyright © 2020 [BIA-Technologies Limited Liability Company](http://bia-tech.ru/)

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
