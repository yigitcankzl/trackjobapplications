import django_filters

from .models import Application


class ApplicationFilter(django_filters.FilterSet):
    applied_date_after = django_filters.DateFilter(
        field_name="applied_date", lookup_expr="gte"
    )
    applied_date_before = django_filters.DateFilter(
        field_name="applied_date", lookup_expr="lte"
    )

    class Meta:
        model = Application
        fields = ["status", "source"]
