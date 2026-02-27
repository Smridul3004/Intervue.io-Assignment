import { useState } from 'react';
import '../styles/components.css';

const OPTION_COLORS = ['var(--option-0)', 'var(--option-1)', 'var(--option-2)', 'var(--option-3)', 'var(--option-4)', 'var(--option-5)'];
const TIME_PRESETS = [15, 30, 45, 60, 90, 120];

interface PollCreationFormProps {
    onSubmit: (data: { question: string; options: string[]; timeLimit: number }) => void;
    isDisabled: boolean;
}

const PollCreationForm = ({ onSubmit, isDisabled }: PollCreationFormProps) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [timeLimit, setTimeLimit] = useState(60);

    const canSubmit =
        question.trim().length > 0 &&
        options.filter((o) => o.trim().length > 0).length >= 2 &&
        !isDisabled;

    const handleAddOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const validOptions = options.filter((o) => o.trim().length > 0);
        onSubmit({
            question: question.trim(),
            options: validOptions.map((o) => o.trim()),
            timeLimit,
        });

        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setTimeLimit(60);
    };

    return (
        <form className="poll-form" onSubmit={handleSubmit}>
            <h2 className="poll-form__title">Create a New Poll</h2>

            {/* Question */}
            <div className="poll-form__group">
                <label className="poll-form__label">Question</label>
                <textarea
                    className="poll-form__input poll-form__textarea"
                    placeholder="Enter your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={500}
                />
            </div>

            {/* Options */}
            <div className="poll-form__group">
                <label className="poll-form__label">Options</label>
                <div className="poll-form__options">
                    {options.map((opt, i) => (
                        <div key={i} className="poll-form__option-row">
                            <span
                                className="poll-form__option-index"
                                style={{ backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }}
                            >
                                {String.fromCharCode(65 + i)}
                            </span>
                            <input
                                className="poll-form__option-input"
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                maxLength={200}
                            />
                            {options.length > 2 && (
                                <button
                                    type="button"
                                    className="poll-form__option-remove"
                                    onClick={() => handleRemoveOption(i)}
                                    title="Remove option"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {options.length < 6 && (
                        <button
                            type="button"
                            className="poll-form__add-option"
                            onClick={handleAddOption}
                        >
                            + Add Option
                        </button>
                    )}
                </div>
            </div>

            {/* Time Limit */}
            <div className="poll-form__group">
                <label className="poll-form__label">Time Limit</label>
                <div className="poll-form__timer-options">
                    {TIME_PRESETS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            className={`poll-form__timer-btn ${timeLimit === t ? 'poll-form__timer-btn--active' : ''}`}
                            onClick={() => setTimeLimit(t)}
                        >
                            {t}s
                        </button>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button type="submit" className="poll-form__submit" disabled={!canSubmit}>
                🚀 Ask Question
            </button>
        </form>
    );
};

export default PollCreationForm;
