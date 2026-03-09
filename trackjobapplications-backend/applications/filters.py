import django_filters

from .models import Application


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class ApplicationFilter(django_filters.FilterSet):
    applied_date_after = django_filters.DateFilter(
        field_name="applied_date", lookup_expr="gte"
    )
    applied_date_before = django_filters.DateFilter(
        field_name="applied_date", lookup_expr="lte"
    )

    tags = NumberInFilter(field_name="tags__id", distinct=True)

    class Meta:
        model = Application
        fields = ["status", "source"]
