import { useState } from 'react';
import '../styles/components.css';

const TIME_PRESETS = [15, 30, 45, 60, 90, 120];
const MAX_QUESTION_LENGTH = 100;

interface PollCreationFormProps {
    onSubmit: (data: { question: string; options: string[]; timeLimit: number; correctOption?: number }) => void;
    isDisabled: boolean;
}

const PollCreationForm = ({ onSubmit, isDisabled }: PollCreationFormProps) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [timeLimit, setTimeLimit] = useState(60);
    const [showTimerDropdown, setShowTimerDropdown] = useState(false);
    const [correctOptions, setCorrectOptions] = useState<(boolean | null)[]>([null, null]);

    const canSubmit =
        question.trim().length > 0 &&
        options.filter((o) => o.trim().length > 0).length >= 2 &&
        !isDisabled;

    const handleAddOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
            setCorrectOptions([...correctOptions, null]);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
            setCorrectOptions(correctOptions.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleCorrectChange = (index: number, value: boolean) => {
        const updated = [...correctOptions];
        updated[index] = value;
        setCorrectOptions(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const validOptions = options.filter((o) => o.trim().length > 0);
        const correctIdx = correctOptions.findIndex((c) => c === true);

        onSubmit({
            question: question.trim(),
            options: validOptions.map((o) => o.trim()),
            timeLimit,
            ...(correctIdx >= 0 ? { correctOption: correctIdx } : {}),
        });

        // Reset form
        setQuestion('');
        setOptions(['', '']);
        setTimeLimit(60);
        setCorrectOptions([null, null]);
    };

    return (
        <form className="poll-form" onSubmit={handleSubmit}>
            {/* Question Header Row — label + timer */}
            <div className="poll-form__header-row">
                <span className="poll-form__section-label">Enter your question</span>
                <div className="poll-form__timer-dropdown-wrapper">
                    <button
                        type="button"
                        className="poll-form__timer-dropdown-btn"
                        onClick={() => setShowTimerDropdown(!showTimerDropdown)}
                    >
                        <span>{timeLimit} seconds</span>
                        <svg width="19" height="18" viewBox="0 0 19 18" fill="none" className="poll-form__timer-arrow">
                            <path d="M9.5 12L4.5 6H14.5L9.5 12Z" fill="#480FB3" />
                        </svg>
                    </button>
                    {showTimerDropdown && (
                        <div className="poll-form__timer-dropdown-menu">
                            {TIME_PRESETS.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`poll-form__timer-dropdown-item ${timeLimit === t ? 'poll-form__timer-dropdown-item--active' : ''}`}
                                    onClick={() => { setTimeLimit(t); setShowTimerDropdown(false); }}
                                >
                                    {t} seconds
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Question textarea */}
            <div className="poll-form__question-wrapper">
                <textarea
                    className="poll-form__textarea"
                    placeholder="Type your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
                    maxLength={MAX_QUESTION_LENGTH}
                />
                <span className="poll-form__char-count">{question.length}/{MAX_QUESTION_LENGTH}</span>
            </div>

            {/* Options + Correct Answer side by side */}
            <div className="poll-form__body-row">
                {/* Left: options */}
                <div className="poll-form__options-section">
                    <span className="poll-form__section-label">Edit Options</span>
                    <div className="poll-form__options">
                        {options.map((opt, i) => (
                            <div key={i} className="poll-form__option-row">
                                <span className="poll-form__option-index">{i + 1}</span>
                                <div className="poll-form__option-input-wrap">
                                    <input
                                        className="poll-form__option-input"
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                        maxLength={200}
                                    />
                                </div>
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
                    </div>
                    {options.length < 6 && (
                        <button
                            type="button"
                            className="poll-form__add-option"
                            onClick={handleAddOption}
                        >
                            + Add More option
                        </button>
                    )}
                </div>

                {/* Right: is it correct? */}
                <div className="poll-form__correct-section">
                    <span className="poll-form__section-label">Is it Correct?</span>
                    <div className="poll-form__correct-list">
                        {options.map((_, i) => (
                            <div key={i} className="poll-form__correct-row">
                                <label className="poll-form__radio-label">
                                    <span
                                        className={`poll-form__radio ${correctOptions[i] === true ? 'poll-form__radio--active' : ''}`}
                                        onClick={() => handleCorrectChange(i, true)}
                                    >
                                        {correctOptions[i] === true && <span className="poll-form__radio-dot" />}
                                    </span>
                                    <span className="poll-form__radio-text">Yes</span>
                                </label>
                                <label className="poll-form__radio-label">
                                    <span
                                        className={`poll-form__radio ${correctOptions[i] === false ? 'poll-form__radio--active' : ''}`}
                                        onClick={() => handleCorrectChange(i, false)}
                                    >
                                        {correctOptions[i] === false && <span className="poll-form__radio-dot" />}
                                    </span>
                                    <span className="poll-form__radio-text">No</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom divider + submit */}
            <div className="poll-form__divider" />
            <div className="poll-form__footer">
                <button type="submit" className="poll-form__submit" disabled={!canSubmit}>
                    Ask Question
                </button>
            </div>
        </form>
    );
};

export default PollCreationForm;
