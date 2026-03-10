{{/*
Expand the name of the chart.
*/}}
{{- define "onepa.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "onepa.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "onepa.labels" -}}
helm.sh/chart: {{ include "onepa.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels for a given component.
*/}}
{{- define "onepa.selectorLabels" -}}
app.kubernetes.io/name: {{ include "onepa.name" . }}-{{ .component }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
