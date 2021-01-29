FROM grafana/grafana:7.2.0

ENV GF_USERS_DEFAULT_THEME="light"
ENV GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/etc/grafana/dashboards/main/apps.json

RUN grafana-cli --pluginsDir=/var/lib/grafana/plugins plugins install grafana-piechart-panel && \
    grafana-cli --pluginsDir=/var/lib/grafana/plugins plugins install michaeldmoore-multistat-panel && \
    grafana-cli --pluginsDir=/var/lib/grafana/plugins plugins install natel-plotly-panel

COPY provisioning /etc/grafana/provisioning
COPY dashboards /etc/grafana/dashboards
