# Kubernetes Deployment - SEPOMEX Crawler

Esta guía te ayudará a desplegar el SEPOMEX Crawler en un cluster de Kubernetes.

## 📋 Prerrequisitos

- Cluster de Kubernetes activo (v1.25+)
- `kubectl` configurado y conectado a tu cluster
- La imagen Docker del crawler construida y disponible en tu registry

## 🏗️ Arquitectura

El deployment incluye dos opciones:

1. **Deployment + Cron interno** (Recomendado para simplicidad)
   - Un pod que corre continuamente con node-cron interno

2. **CronJob de Kubernetes** (Recomendado para control granular)
   - Jobs programados que se ejecutan periódicamente

## 🚀 Opción 1: Deployment con Cron Interno

### 1. Construir y subir la imagen

```bash
# Desde el directorio raíz del proyecto
docker build -t sepomex-crawler:latest .

# Si usas un registry privado
docker tag sepomex-crawler:latest your-registry.com/sepomex-crawler:latest
docker push your-registry.com/sepomex-crawler:latest
```

### 2. Actualizar la imagen en deployment.yaml

Edita `k8s/deployment.yaml` y actualiza:

```yaml
containers:
- name: sepomex-crawler
  image: your-registry.com/sepomex-crawler:latest  # Actualiza aquí
```

### 3. Aplicar los manifiestos

```bash
# Aplicar ConfigMap
kubectl apply -f k8s/configmap.yaml

# Aplicar PersistentVolumeClaims
kubectl apply -f k8s/pvc.yaml

# Aplicar Deployment
kubectl apply -f k8s/deployment.yaml
```

### 4. Verificar el deployment

```bash
# Ver el estado del pod
kubectl get pods -l app=sepomex-crawler

# Ver logs en tiempo real
kubectl logs -f deployment/sepomex-crawler

# Ver configuración
kubectl describe deployment sepomex-crawler
```

## 🚀 Opción 2: CronJob de Kubernetes

Esta opción es mejor si prefieres que Kubernetes maneje la programación.

### 1. Aplicar los manifiestos

```bash
# Aplicar ConfigMap
kubectl apply -f k8s/configmap.yaml

# Aplicar PersistentVolumeClaims
kubectl apply -f k8s/pvc.yaml

# Aplicar CronJob
kubectl apply -f k8s/cronjob.yaml
```

### 2. Verificar el CronJob

```bash
# Ver el CronJob
kubectl get cronjobs

# Ver jobs ejecutados
kubectl get jobs

# Ver logs del último job
kubectl logs -l app=sepomex-crawler --tail=100
```

### 3. Ejecutar manualmente (para pruebas)

```bash
# Crear un job manual basado en el CronJob
kubectl create job sepomex-manual --from=cronjob/sepomex-crawler-job

# Ver el progreso
kubectl logs -f job/sepomex-manual
```

## ⚙️ Configuración

### Editar variables de entorno

Modifica `k8s/configmap.yaml`:

```yaml
data:
  # Cambiar programación (formato cron)
  CRON_SCHEDULE: "0 3 * * 1"  # Lunes 3:00 AM

  # Timeout de descarga (milisegundos)
  DOWNLOAD_TIMEOUT: "300000"  # 5 minutos

  # Reintentos
  MAX_RETRIES: "5"
```

Luego aplica los cambios:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl rollout restart deployment/sepomex-crawler
```

### Ajustar recursos

Modifica `k8s/deployment.yaml` o `k8s/cronjob.yaml`:

```yaml
resources:
  limits:
    cpu: "500m"        # Máximo CPU
    memory: "512Mi"    # Máxima memoria
  requests:
    cpu: "250m"        # CPU solicitado
    memory: "256Mi"    # Memoria solicitada
```

### Ajustar almacenamiento

Modifica `k8s/pvc.yaml`:

```yaml
resources:
  requests:
    storage: 2Gi  # Cambia según necesites
```

## 📊 Monitoreo

### Ver logs

```bash
# Deployment
kubectl logs -f deployment/sepomex-crawler

# CronJob (último job)
kubectl logs -l app=sepomex-crawler --tail=100

# Ver logs de un job específico
kubectl logs job/sepomex-crawler-job-28947483
```

### Ver estado

```bash
# Estado del deployment
kubectl get deployment sepomex-crawler

# Estado de los pods
kubectl get pods -l app=sepomex-crawler

# Eventos recientes
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Acceder a los archivos

```bash
# Ejecutar shell en el pod
kubectl exec -it deployment/sepomex-crawler -- /bin/sh

# Ver archivos descargados
kubectl exec deployment/sepomex-crawler -- ls -lh /app/data

# Copiar archivos del pod
kubectl cp sepomex-crawler-<pod-id>:/app/data/versions.json ./versions.json
```

## 🔧 Comandos Útiles

### Ejecutar crawler manualmente

```bash
# Deployment
kubectl exec -it deployment/sepomex-crawler -- node src/index.js --force-download

# Solo verificar actualizaciones
kubectl exec -it deployment/sepomex-crawler -- node src/index.js --check-only
```

### Reiniciar el deployment

```bash
kubectl rollout restart deployment/sepomex-crawler
```

### Ver historial de rollouts

```bash
kubectl rollout history deployment/sepomex-crawler
```

### Escalar (aunque generalmente debe ser 1)

```bash
# Escalar a 0 (detener)
kubectl scale deployment sepomex-crawler --replicas=0

# Escalar a 1 (iniciar)
kubectl scale deployment sepomex-crawler --replicas=1
```

## 🗑️ Limpieza

### Eliminar todo

```bash
# Opción 1: Deployment
kubectl delete -f k8s/deployment.yaml

# Opción 2: CronJob
kubectl delete -f k8s/cronjob.yaml

# ConfigMap
kubectl delete -f k8s/configmap.yaml

# PVCs (esto elimina los datos!)
kubectl delete -f k8s/pvc.yaml
```

### Mantener datos pero eliminar pods

```bash
# Solo eliminar deployment/cronjob
kubectl delete deployment sepomex-crawler
# o
kubectl delete cronjob sepomex-crawler-job

# Los PVCs y datos se mantienen
```

## 📦 Namespace personalizado

Si quieres usar un namespace específico:

```bash
# Crear namespace
kubectl create namespace sepomex

# Aplicar en ese namespace
kubectl apply -f k8s/ -n sepomex

# Ver recursos
kubectl get all -n sepomex
```

O edita todos los archivos YAML y cambia:

```yaml
metadata:
  namespace: sepomex  # Cambiar de 'default' a tu namespace
```

## 🔒 Seguridad

Los manifiestos incluyen:

- ✅ Usuario no-root (uid 1001)
- ✅ Límites de recursos
- ✅ Security contexts
- ✅ Capabilities mínimas
- ✅ Read-only root filesystem donde sea posible

## 🌐 Acceso desde otros pods

Si necesitas acceder a los datos desde otros pods:

### Opción 1: Volumen compartido

```yaml
# En otro deployment
volumes:
- name: sepomex-data
  persistentVolumeClaim:
    claimName: sepomex-data
```

### Opción 2: Crear un Service + API

Podrías extender el crawler para exponer una API HTTP simple.

## 🐛 Troubleshooting

### Pod no inicia

```bash
# Ver eventos
kubectl describe pod -l app=sepomex-crawler

# Ver logs
kubectl logs -l app=sepomex-crawler --previous
```

### Error de permisos

Verifica que el PVC tenga los permisos correctos:

```bash
kubectl exec deployment/sepomex-crawler -- ls -la /app/data
```

### PVC no se crea

```bash
# Ver PVCs
kubectl get pvc

# Ver detalles
kubectl describe pvc sepomex-data

# Ver storage classes disponibles
kubectl get storageclass
```

Si tu cluster no tiene un storage class por defecto, edita `pvc.yaml` y especifica uno:

```yaml
spec:
  storageClassName: standard  # o el nombre de tu storage class
```

### Imagen no se encuentra

```bash
# Verificar image pull policy
kubectl describe pod -l app=sepomex-crawler | grep -A5 "Image"

# Si es un registry privado, crear secret
kubectl create secret docker-registry regcred \
  --docker-server=your-registry.com \
  --docker-username=your-user \
  --docker-password=your-password

# Agregar al deployment
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
```

### CronJob no se ejecuta

```bash
# Ver el CronJob
kubectl get cronjob sepomex-crawler-job

# Ver último schedule
kubectl describe cronjob sepomex-crawler-job

# Verificar timezone (requiere K8s 1.25+)
kubectl get cronjob sepomex-crawler-job -o yaml | grep timeZone
```

## 📚 Recursos Adicionales

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [CronJob Best Practices](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)

## 🎯 Mejores Prácticas

1. **Usa CronJob** si necesitas control granular sobre las ejecuciones
2. **Usa Deployment** si prefieres un proceso continuo simple
3. **Siempre configura resource limits** para evitar consumo excesivo
4. **Monitorea los logs** regularmente
5. **Haz backup de los PVCs** periódicamente
6. **Usa un namespace dedicado** en producción
7. **Implementa alertas** sobre fallos en el CronJob

---

**¿Necesitas ayuda?** Revisa la sección de Troubleshooting o los logs con `kubectl logs`.
