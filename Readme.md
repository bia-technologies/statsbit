# Statsbit

Here is the [NewRelic](https://newrelic.com) drop-in replacement.
It works with all NewRelic's agents that support
[the 17th protocol version](https://github.com/newrelic/newrelic-ruby-agent/search?q=PROTOCOL_VERSION).
In BIA we use agents on ruby, python, go, java.

Statsbit consists of Backend and UI.
Backend is written in Clojure and stores data in [TimescaleDB](https://www.timescale.com).
UI is built on top of [Grafana](https://grafana.com).

## Setup

Statsbit requires Postgres with the Timescale extension.
We run Statsibt on Postgres 11 and Timescale 1.7.4.
I plan to support the upcoming Timescale 2.0 too.
I've successfully tested some requests on Postgres 12, so you may help us to test Statsbit on the 12th version.

Also, every NewRelic agent requires a valid SSL certificate for the backend.

## Naming

Early I maintained [a fork](https://github.com/Undev/errbit) of Errbit
that used Postgres instead of MongoDB, so I chose a similar name.

## License

Copyright © 2020 [BIA-Technologies Limited Liability Company](http://bia-tech.ru/)

Distributed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)
