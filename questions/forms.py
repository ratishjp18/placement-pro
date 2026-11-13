from django import forms

from .models import Question


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['section', 'topic', 'difficulty', 'marks', 'text',
                  'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'is_active']
        widgets = {
            'text': forms.Textarea(attrs={'rows': 3}),
            **{f'option_{l}': forms.Textarea(attrs={'rows': 2}) for l in 'abcd'},
        }


class CSVImportForm(forms.Form):
    file = forms.FileField(label='CSV file')
